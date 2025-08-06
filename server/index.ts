import cors from "cors";
import "dotenv/config"; // Load .env file
import express, { NextFunction, type Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { setupAdminPanel } from "./admin-panel";
import { setupCookiePolicy } from "./cookiePolicy"; // Import our cookie policy middleware
import { checkDatabaseConnection } from "./db"; // Import our enhanced database connection check
import * as emailManager from "./emailManager"; // Import email manager
import { routeDelay } from "./middleware"; // Import our custom middleware
import { applyRoutePatches } from "./route-patches";
import { registerRoutes } from "./routes";
import { securityMiddleware } from "./security-middleware";
import { DatabaseStorage } from "./storage";
import { log, serveStatic, setupVite } from "./vite";

// Initialize Express app
const app = express();

// Health check endpoint - no rate limiting
app.get("/health", async (req: Request, res: Response) => {
  try {
    const dbConnected = await checkDatabaseConnection();
    if (!dbConnected) {
      return res.status(200).json({
        status: "ok",
        message: "Server is running with limited functionality",
        database: "disconnected",
      });
    }
    res.status(200).json({
      status: "ok",
      database: "connected",
    });
  } catch (error) {
    res.status(200).json({
      status: "ok",
      message: "Server is running with limited functionality",
      database: "error",
    });
  }
});

// Declare global variables for TypeScript
declare global {
  var dbConnectionIssues: boolean;
}

// Create a storage instance
const storage = new DatabaseStorage();

// Configure rate limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: "Too many requests, please try again later.",
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // Limit each IP to 50 login attempts per windowMs
  message: "Too many login attempts, please try again later.",
});

const visitorLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // Limit each IP to 60 requests per minute for visitor tracking
  message: "Too many visitor tracking requests, please try again later.",
});

// Apply rate limiters strategically
app.use("/api/", generalLimiter); // Apply to all API routes as base limiter
app.use("/api/auth/", authLimiter); // Apply stricter limits to auth routes
app.use("/api/visitors/", visitorLimiter); // Apply specific limits to visitor tracking routes

// Apply security middleware
app.use(securityMiddleware);
// For all environments, use the standard cors middleware with appropriate settings
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);

      // For development and testing
      if (process.env.NODE_ENV === "development") {
        return callback(null, true); // Allow all origins in development
      }

      const allowedOrigins = [
        // Production domains
        "https://axix-finance.vercel.app",
        "https://www.axixfinance.com",
        process.env.CORS_ORIGIN,
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
        // Specific domains that need access
        "https://translate.googleapis.com",
        "https://translate.google.com",
      ].filter(Boolean); // Remove undefined/null values

      // Check if the origin is in our allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // List of trusted third-party domains
      const trustedDomains = [
        "coin360.com",
        "tradingview.com",
        "coinmarketcap.com",
        "translate.googleapis.com",
        "translate.google.com",
        "googleapis.com",
        "googleusercontent.com",
        "gstatic.com",
      ];

      // Check if it's a third-party trusted domain
      if (trustedDomains.some((domain) => origin.includes(domain))) {
        return callback(null, true);
      }

      // Log rejected origins to help with debugging
      console.log(`Rejected Origin: ${origin}`);
      callback(new Error("Not allowed by CORS"));
    },
    credentials: true,
    exposedHeaders: ["Set-Cookie"],
  })
);

// Apply our custom cookie policy middleware
app.use(setupCookiePolicy);

// Body parsers
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Apply our custom middleware for better auth handling and stability
app.use(routeDelay);
// app.use(gracefulAuth); // Temporarily disabled to fix authentication issues

// Rate limiting to prevent brute force attacks
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use("/api/", apiLimiter);

// Request logging middleware with improved formatting
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;

  // Store original methods
  const originalJson = res.json;
  const originalSend = res.send;

  // Override json method
  res.json = function (body) {
    // Restore original method before calling it
    res.json = originalJson;

    // Log response info after the response has been set up
    res.on("finish", () => {
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
          userId: req.user?.id || "anonymous",
        };

        // Log to console in development
        if (process.env.NODE_ENV !== "production") {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
          log(logLine);
        } else {
          // Log to database in production for important events
          if (res.statusCode >= 400 || path.includes("/auth/")) {
            storage
              .createLog({
                type: res.statusCode >= 400 ? "error" : "info",
                message: `${req.method} ${path} ${res.statusCode}`,
                details: { ...logData, ipAddress: ip },
                userId: req.user?.id,
              })
              .catch((err) => console.error("Failed to log to database:", err));
          }

          // Always console log in production, formatted as JSON for easier parsing
          if (process.env.NODE_ENV !== "production")
            console.log(JSON.stringify(logData));
        }
      }
    });

    // Call the original method
    return originalJson.call(this, body);
  };

  // Also handle res.send for completeness
  res.send = function (body) {
    // Restore original method before calling it
    res.send = originalSend;

    // Log response info after the response has been set up
    res.on("finish", () => {
      const duration = Date.now() - start;
      if (path.startsWith("/api")) {
        if (process.env.NODE_ENV !== "production") {
          let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
          if (logLine.length > 80) logLine = logLine.slice(0, 79) + "…";
          log(logLine);
        } else {
          if (process.env.NODE_ENV !== "production")
            console.log(
              JSON.stringify({
                timestamp: new Date().toISOString(),
                method: req.method,
                path,
                status: res.statusCode,
                duration: `${duration}ms`,
                ip,
                userId: req.user?.id || "anonymous",
              })
            );
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
    const ip = req.headers["x-forwarded-for"] || req.socket.remoteAddress;
    const logData = {
      error: err.name || "Error",
      message: err.message,
      stack: process.env.NODE_ENV !== "production" ? err.stack : undefined,
      path: req.path,
      method: req.method,
      status,
      ip,
      userId: req.user?.id || "anonymous",
      timestamp: new Date().toISOString(),
    };

    // Log all errors to console
    console.error("Server error:", JSON.stringify(logData));

    // For production, also log severe errors to database
    if (process.env.NODE_ENV === "production" && status >= 500) {
      storage
        .createLog({
          type: "error",
          message: `${err.name || "Error"}: ${err.message}`,
          details: logData,
          userId: req.user?.id,
          ipAddress: ip as string,
        })
        .catch((err) => console.error("Failed to log error to database:", err));
    }

    // Only send response if headers haven't been sent yet
    if (!res.headersSent) {
      // Sanitize error messages in production
      const clientMessage =
        process.env.NODE_ENV === "production" && status >= 500
          ? "An unexpected error occurred. Our team has been notified."
          : message;

      res.status(status).json({
        message: clientMessage,
        requestId:
          Date.now().toString(36) + Math.random().toString(36).substring(2, 5),
        status,
      });
    }
  });

  // ===== CRITICAL: Set up dedicated admin panel BEFORE setting up Vite =====
  // This ensures our admin API routes are registered before any catch-all routes

  // Set up the dedicated admin panel routes
  setupAdminPanel(app);
  console.log(
    "🔄 Admin panel routes registered - order is critical for proper API functionality"
  );

  // Also apply any existing route patches for compatibility
  applyRoutePatches(app);
  console.log("🔄 Legacy route patches applied for compatibility");

  // Setup Vite middleware after API routes
  if (process.env.NODE_ENV !== "production") {
    log("🔄 Setting up Vite middleware AFTER API routes");
    await setupVite(app);
  } else {
    // Serve static files in production
    serveStatic(app);

    // Add a simple root endpoint for testing in production only
    app.get("/api/health", (req, res) => {
      res.json({
        message: "Axix Finance Server is running",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
      });
    });
  }

  // ALWAYS serve the app on a configurable port
  // this serves both the API and the client
  const port = parseInt(process.env.PORT || "5000");
  const host = "0.0.0.0"; // Use 0.0.0.0 for Replit compatibility

  // Check database connection before starting the server
  try {
    // Always check database connection regardless of environment
    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
      console.warn(
        "⚠️ Database connection issues detected. Server will start but some features may be limited."
      );
      // Set a global flag that can be used to show a maintenance message in the UI
      global.dbConnectionIssues = true;
    }

    // Initialize email services (Resend preferred, SMTP as fallback)
    try {
      // Check if email services are configured
      const emailConfigured = emailManager.isEmailServiceConfigured();

      if (!emailConfigured) {
        console.warn(
          "⚠️ No email service is configured. Email functionality will not work."
        );
        console.warn(
          "⚠️ Make sure to set the RESEND_API_KEY in your environment variables."
        );
      } else {
        // Initialize email services
        const initialized = await emailManager.initializeEmailServices();

        if (initialized) {
          console.log(
            `📧 Email service initialized: ${emailManager.getActiveEmailService()}`
          );

          // Test email services if needed
          if (process.env.TEST_EMAIL_ON_STARTUP === "true") {
            console.log("Running email test at startup as requested...");
            // Add test email functionality here if needed
          }
        } else {
          console.warn(
            "⚠️ Email services are configured but failed to initialize properly."
          );
        }
      }
    } catch (error) {
      console.error("⚠️ Error initializing email services:", error);
    }

    // Start the server
    server.listen(port, host, () => {
      console.log(`🚀 Server running in ${process.env.NODE_ENV || "development"} mode`);
      console.log(`🔗 Local: http://localhost:${port}`);
      console.log(`🔗 Network: http://${host}:${port}`);
      console.log(`📱 Preview should be available at the webview URL`);

      if (dbConnected) {
        console.log("📊 Database connection established");

        // Initialize database with required settings
        if (process.env.NODE_ENV === "production") {
          storage.initializeDatabase().catch((err) => {
            console.error("Failed to initialize database:", err);
          });
        }
      } else {
        if (process.env.NODE_ENV !== "production")
          console.log(
            "⚠️ Running with limited functionality due to database connection issues"
          );
        if (process.env.NODE_ENV !== "production")
          console.log(
            "⚠️ The application will automatically retry connecting to the database"
          );
      }

      // Set up periodic database connection check (every 30 seconds)
      const dbCheckInterval = setInterval(async () => {
        const reconnected = await checkDatabaseConnection();

        if (reconnected && global.dbConnectionIssues) {
          if (process.env.NODE_ENV !== "production")
            console.log("✅ Database connection re-established");
          global.dbConnectionIssues = false;

          // Initialize database if needed
          if (process.env.NODE_ENV === "production") {
            storage.initializeDatabase().catch((err) => {
              console.error("Failed to initialize database:", err);
            });
          }
        } else if (!reconnected && !global.dbConnectionIssues) {
          console.error("❌ Lost connection to database");
          global.dbConnectionIssues = true;
        }
      }, 30000); // Check every 30 seconds

      // Clean up interval on process exit
      process.on("SIGTERM", () => {
        clearInterval(dbCheckInterval);
        server.close();
      });

      process.on("SIGINT", () => {
        clearInterval(dbCheckInterval);
        server.close();
      });
    });
  } catch (err) {
    console.error("Failed to check database connection:", err);
    console.warn("⚠️ Starting server without database connection check");

    // Start the server anyway
    server.listen(port, host, () => {
      if (process.env.NODE_ENV !== "production")
        console.log(
          `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
        );
      if (process.env.NODE_ENV !== "production")
        console.log(`🔗 http://localhost:${port}`);
      if (process.env.NODE_ENV !== "production")
        console.log(
          "⚠️ Running with limited functionality due to database connection issues"
        );
    });
  }
})().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});