import cors from "cors";
import express, { NextFunction, type Request, Response } from "express";
import rateLimit from "express-rate-limit";
import { setupAdminApi } from "./admin-api";
import { setupAuth } from "./auth";
// Legacy admin panel disabled (replaced by modular admin API)
// import { setupAdminPanel } from "./admin-panel";
import { setupCookiePolicy } from "./cookiePolicy"; // Import our cookie policy middleware
import { checkDatabaseConnection } from "./db"; // Import our enhanced database connection check
import * as emailManager from "./emailManager"; // Import email manager
import { routeDelay } from "./middleware"; // Import our custom middleware
import { applyRoutePatches } from "./route-patches";
import router from "./routes";
import { securityMiddleware } from "./security-middleware";
import { DatabaseStorage } from "./storage";
import { visitorRouter } from "./visitor-routes";
import { log, serveStatic, setupVite } from "./vite";
// Express user augmentation (lightweight) so TS stops complaining about req.user.id
declare global {
  namespace Express {
    // Minimal shape used across routes & logging
    // Extend cautiously; real auth system should supply a proper type.
    interface User {
      id: number;
      email?: string;
      role?: string;
      username?: string;
      isVerified?: boolean;
    }
  }
}

// Initialize Express app
const app = express();

// Warn early if JWT secret missing (affects bearer mapping for admin & transactions)
if (!process.env.SUPABASE_JWT_SECRET) {
  console.warn(
    "[startup] SUPABASE_JWT_SECRET not set – bearer token verification will fail; mapping will rely on fallback if enabled."
  );
}

// Body parsers - MUST come before auth setup which uses req.body
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false }));

// Centralized auth setup (session + passport strategies + /api/login, /api/register routes)
setupAuth(app);

// Health check endpoint - no rate limiting
app.get("/health", (_req: Request, res: Response) => {
  // Do not perform external checks here; keep it fast and reliable for Fly health probes
  res.status(200).json({ status: "ok" });
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

// Visitor limiter temporarily disabled to prevent interference with admin tests
// const visitorLimiter = rateLimit({
//   windowMs: 1 * 60 * 1000, // 1 minute
//   max: 60, // Limit each IP to 60 requests per minute for visitor tracking
//   message: "Too many visitor tracking requests, please try again later.
// });

// Apply rate limiters strategically
app.use("/api/", generalLimiter); // Apply to all API routes as base limiter
app.use("/api/auth/", authLimiter); // Apply stricter limits to auth routes
// app.use("/api/visitors/", visitorLimiter); // Disabled for now

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
      if (
        allowedOrigins.includes(origin) ||
        /https?:\/\/[a-z0-9-]+\.fly\.dev$/i.test(origin)
      ) {
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

// Apply our custom middleware for better auth handling and stability
app.use(routeDelay);
// app.use(gracefulAuth); // Temporarily disabled to fix authentication issues

// Rate limiting to prevent brute force attacks (general)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
// Separate, higher threshold limiter for admin to reduce accidental 429 during development
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
});
// Mount visitor tracking endpoints before general API limiter so frequent pings
// from widgets or third-party scripts don't quickly hit rate limits in development.
app.use("/api/visitors", visitorRouter);

app.use("/api/", apiLimiter);
app.use("/api/admin/", adminLimiter);

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

// Mount minimal router under /api
app.use("/api", router);
// Email health endpoint (registered early so static catch-all doesn't override)
app.get("/api/email/health", async (req, res) => {
  if (process.env.NODE_ENV !== "production")
    console.log("➡️  /api/email/health hit");
  try {
    // Lazy import to avoid circular issues
    const { getEmailHealth } = await import("./emailManager");
    const data = await getEmailHealth();
    const status = data.available ? "ok" : "unavailable";
    res.setHeader("Content-Type", "application/json");
    res.status(200).send(JSON.stringify({ status, ...data }));
  } catch (err: any) {
    res
      .status(500)
      .setHeader("Content-Type", "application/json")
      .send(
        JSON.stringify({
          status: "error",
          error: err?.message || String(err),
        })
      );
  }
});
// Visitor tracking endpoints (must be before Vite catch-all)
app.use("/api/visitors", visitorRouter);

(async () => {
  // Create a real Node HTTP server so Vite HMR can attach a websocket listener.
  // Using the express app directly (app.listen) returns an http.Server, but we also
  // need the instance BEFORE calling listen to pass into setupVite for HMR server option.
  // We'll create it lazily after middleware setup if needed.
  // For development we construct the server explicitly; for production we can still call listen later.
  const http = await import("http");
  const server: any = http.createServer(app);

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
      // Removed duplicate createLog call with ipAddress
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

  // ===== CRITICAL ORDER: Modular admin API -> existing admin panel -> legacy patches =====
  setupAdminApi(app); // Modular admin API endpoints
  // setupAdminPanel(app); // DISABLED legacy panel
  console.log("🔄 Legacy admin panel disabled; only modular admin API active");
  applyRoutePatches(app); // Legacy compatibility endpoints
  console.log("🔄 Legacy route patches applied for compatibility");

  // Ensure unmatched /api requests return JSON 404 instead of falling through to HTML
  // Place AFTER all API mounts (admin, visitors, patches) and BEFORE static catch-all
  app.use("/api", (req: Request, res: Response) => {
    if (!res.headersSent) {
      res.status(404).json({ message: "Not Found", path: req.path });
    }
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    console.log("🔄 Setting up Vite middleware AFTER API routes");
    await setupVite(app, server);
  } else {
    console.log("🔄 Setting up static file serving AFTER API routes");
    serveStatic(app);
  }

  // ALWAYS serve the app on a configurable port
  // this serves both the API and the client
  const port = parseInt(
    process.env.PORT ||
      (process.env.NODE_ENV === "production" ? "8080" : "4000")
  );
  // In containers (Fly.io), bind to 0.0.0.0 so the proxy can reach the service
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1"; // Bind to all interfaces in production

  // Check database connection before starting the server
  try {
    // Start the server immediately; perform external checks asynchronously afterwards
    server.listen(port, host, () => {
      if (process.env.NODE_ENV !== "production")
        console.log(
          `🚀 Server running in ${process.env.NODE_ENV || "development"} mode`
        );
      if (process.env.NODE_ENV !== "production")
        console.log(`🔗 http://localhost:${port}`);

      // Kick off DB connectivity check and email service initialization asynchronously
      (async () => {
        try {
          const dbConnected = await checkDatabaseConnection();
          if (dbConnected) {
            if (process.env.NODE_ENV !== "production")
              console.log("📊 Database connection established");
            if (process.env.NODE_ENV === "production") {
              storage.initializeDatabase().catch((err) => {
                console.error("Failed to initialize database:", err);
              });
            }
          } else {
            console.warn(
              "⚠️ Database connection issues detected. Running with limited functionality."
            );
            global.dbConnectionIssues = true;
          }
        } catch (err) {
          console.error("Failed to check database connection:", err);
          console.warn(
            "⚠️ Proceeding without confirmed database connection; periodic checks will continue."
          );
          global.dbConnectionIssues = true;
        }

        try {
          const emailConfigured = emailManager.isEmailServiceConfigured();
          if (!emailConfigured) {
            console.warn(
              "⚠️ No email service is configured. Email functionality will not work."
            );
            console.warn(
              "⚠️ Make sure to set the RESEND_API_KEY in your environment variables."
            );
          } else {
            const initialized = await emailManager.initializeEmailServices();
            if (initialized) {
              console.log(
                `📧 Email service initialized: ${emailManager.getActiveEmailService()}`
              );
              if (process.env.TEST_EMAIL_ON_STARTUP === "true") {
                console.log("Running email test at startup as requested...");
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
      })();

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
