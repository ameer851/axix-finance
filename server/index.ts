import 'dotenv/config'; // Load .env file
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { DatabaseStorage } from "./storage";
import { checkDatabaseConnection } from "./db"; // Import our enhanced database connection check

// Declare global variables for TypeScript
declare global {
  var dbConnectionIssues: boolean;
}

// Create a storage instance
const storage = new DatabaseStorage();
import helmet from "helmet";
import cors from "cors";
import rateLimit from "express-rate-limit";

// Initialize express application
const app = express();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: process.env.NODE_ENV === 'production',
  crossOriginEmbedderPolicy: process.env.NODE_ENV === 'production',
  crossOriginOpenerPolicy: process.env.NODE_ENV === 'production',
  crossOriginResourcePolicy: process.env.NODE_ENV === 'production'
}));
// For all environments, use the standard cors middleware with appropriate settings
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    
    // Development origins
    const developmentOrigins = [
      'http://localhost:4000',
      'http://localhost:5173',
      'http://127.0.0.1:4000',
      'http://127.0.0.1:5173'
    ];
    
    // Production and ngrok origins
    const allowedOrigins = [
      ...developmentOrigins,
      process.env.CORS_ORIGIN || 'https://your-production-domain.com'
    ];
    
    // Allow ngrok tunnels (they follow the pattern *.ngrok.io or *.ngrok-free.app)
    if (origin.includes('.ngrok.io') || origin.includes('.ngrok-free.app') || origin.includes('.ngrok.app')) {
      return callback(null, true);
    }
    
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    
    // For development, be more permissive
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

// Body parsers
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false }));

// Rate limiting to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', apiLimiter);

// Request logging middleware with improved formatting
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  
  // Store original methods
  const originalJson = res.json;
  const originalSend = res.send;
  
  // Override json method
  res.json = function(body) {
    // Restore original method before calling it
    res.json = originalJson;
    
    // Log response info after the response has been set up
    res.on('finish', () => {
      const duration = Date.now() - start;
      
      if (path.startsWith("/api")) {
        // Create log entry for API calls
        const logData = {
          timestamp: new Date().toISOString(),
          method: req.method,
          path,
          status: res.statusCode,
          duration: `${duration}ms`,
          ip,
          userId: req.user?.id || 'anonymous'
        };
        
        // Log to console in development
        if (process.env.NODE_ENV !== 'production') {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
          log(logLine);
        } else {
          // Log to database in production for important events
          if (res.statusCode >= 400 || path.includes('/auth/')) {
            storage.createLog({
              type: res.statusCode >= 400 ? "error" : "info",
              message: `${req.method} ${path} ${res.statusCode}`,
              details: logData,
              userId: req.user?.id,
              ipAddress: ip as string
            }).catch(err => console.error('Failed to log to database:', err));
          }
          
          // Always console log in production, formatted as JSON for easier parsing
          if (process.env.NODE_ENV !== "production") console.log(JSON.stringify(logData));
        }
      }
    });
    
    // Call the original method
    return originalJson.call(this, body);
  };
  
  // Also handle res.send for completeness
  res.send = function(body) {
    // Restore original method before calling it
    res.send = originalSend;
    
    // Log response info after the response has been set up
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        if (process.env.NODE_ENV !== 'production') {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
          log(logLine);
        } else {
          if (process.env.NODE_ENV !== "production") console.log(JSON.stringify({
            timestamp: new Date().toISOString(),
            method: req.method,
            path,
            status: res.statusCode,
            duration: `${duration}ms`,
            ip,
            userId: req.user?.id || 'anonymous'
          }));
        }
      }
    });
    
    // Call the original method
    return originalSend.call(this, body);
  };
  
  next();
});

(async () => {
  const server = await registerRoutes(app);

  // Global error handler - should be registered after all routes
  app.use((err: any, req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    
    // Log error details but don't expose them in production
    const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
    const logData = {
      error: err.name || 'Error',
      message: err.message,
      stack: process.env.NODE_ENV !== 'production' ? err.stack : undefined,
      path: req.path,
      method: req.method,
      status,
      ip,
      userId: req.user?.id || 'anonymous',
      timestamp: new Date().toISOString()
    };
    
    // Log all errors to console
    console.error('Server error:', JSON.stringify(logData));
    
    // For production, also log severe errors to database
    if (process.env.NODE_ENV === 'production' && status >= 500) {
      storage.createLog({
        type: "error",
        message: `${err.name || 'Error'}: ${err.message}`,
        details: logData,
        userId: req.user?.id,
        ipAddress: ip as string
      }).catch(err => console.error('Failed to log error to database:', err));
    }

    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      // Sanitize error messages in production
      const clientMessage = process.env.NODE_ENV === 'production' && status >= 500
        ? 'An unexpected error occurred. Our team has been notified.'
        : message;
        
      res.status(status).json({ 
        message: clientMessage,
        requestId: Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        status
      });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on a configurable port
  // this serves both the API and the client
  const port = process.env.PORT || 4000;
  const host = process.env.HOST || '0.0.0.0'; // Listen on all interfaces in production
  
  // Check database connection before starting the server
  try {
    // Always check database connection regardless of environment
    const dbConnected = await checkDatabaseConnection();
    
    if (!dbConnected) {
      console.warn('⚠️ Database connection issues detected. Server will start but some features may be limited.');
      // Set a global flag that can be used to show a maintenance message in the UI
      global.dbConnectionIssues = true;
    }
    
    // Start the server
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      if (process.env.NODE_ENV !== "production") console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      if (process.env.NODE_ENV !== "production") console.log(`🔗 http://localhost:${port}`);
      
      if (dbConnected) {
        if (process.env.NODE_ENV !== "production") console.log('📊 Database connection established');
        
        // Initialize database with required settings
        if (process.env.NODE_ENV === 'production') {
          storage.initializeDatabase().catch(err => {
            console.error('Failed to initialize database:', err);
          });
        }
      } else {
        if (process.env.NODE_ENV !== "production") console.log('⚠️ Running with limited functionality due to database connection issues');
        if (process.env.NODE_ENV !== "production") console.log('⚠️ The application will automatically retry connecting to the database');
      }
      
      // Set up periodic database connection check (every 30 seconds)
      const dbCheckInterval = setInterval(async () => {
        const reconnected = await checkDatabaseConnection();
        
        if (reconnected && global.dbConnectionIssues) {
          if (process.env.NODE_ENV !== "production") console.log('✅ Database connection re-established');
          global.dbConnectionIssues = false;
          
          // Initialize database if needed
          if (process.env.NODE_ENV === 'production') {
            storage.initializeDatabase().catch(err => {
              console.error('Failed to initialize database:', err);
            });
          }
        } else if (!reconnected && !global.dbConnectionIssues) {
          console.error('❌ Lost connection to database');
          global.dbConnectionIssues = true;
        }
      }, 30000); // Check every 30 seconds
      
      // Clean up interval on process exit
      process.on('SIGTERM', () => {
        clearInterval(dbCheckInterval);
        server.close();
      });
      
      process.on('SIGINT', () => {
        clearInterval(dbCheckInterval);
        server.close();
      });
    });
  } catch (err) {
    console.error('Failed to check database connection:', err);
    console.warn('⚠️ Starting server without database connection check');
    
    // Start the server anyway
    server.listen({
      port,
      host,
      reusePort: true,
    }, () => {
      if (process.env.NODE_ENV !== "production") console.log(`🚀 Server running in ${process.env.NODE_ENV || 'development'} mode`);
      if (process.env.NODE_ENV !== "production") console.log(`🔗 http://localhost:${port}`);
      if (process.env.NODE_ENV !== "production") console.log('⚠️ Running with limited functionality due to database connection issues');
    });
  }
})().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
