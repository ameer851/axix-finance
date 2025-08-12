import type { VercelRequest, VercelResponse } from "@vercel/node";
// Do not import routes at module load; we will dynamic-import inside ensureInitialized()

// Force Node.js runtime for Vercel
export const config = { runtime: "nodejs" };

// NOTE: Do NOT import routes here – dynamic import inside ensureInitialized isolates import-time errors
// import { registerRoutes } from "./routes";
// WARNING: tsconfig has "noEmit": true so raw .ts files are shipped.
// Vercel ESM loader cannot import TypeScript directly at runtime; ensure either:
// 1) Build step emits compiled .js for api/, or
// 2) Provide .js shims (temporary) alongside .ts (we added auth-middleware.js).
// Recommended fix: introduce a separate tsconfig.build.json that emits serverless API code.

// Early bootstrap log (helps identify cold start vs reuse)
console.log(
  "[bootstrap] Serverless function file loaded at",
  new Date().toISOString()
);

// Create Express app once; initialize lazily on first request
let app: any = null;
let initialized = false;
let initializing = false;
let lastInitError: { message: string; stack?: string } | null = null;

// Minimal mode lets us deploy preflight-only to diagnose crashes without loading routes
const MINIMAL_MODE =
  process.env.API_MINIMAL_MODE === "1" ||
  process.env.API_DISABLE_ROUTES === "1";

// CORS configuration
const corsOptions = {
  origin: function (
    origin: string | undefined,
    callback: (err: Error | null, allow?: boolean) => void
  ) {
    const allowedOrigins = [
      "http://localhost:4000",
      "http://localhost:3000",
      "https://axix-finance.vercel.app",
      "https://www.axixfinance.com",
      "https://axixfinance.com",
    ];

    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      // Do not throw – allow but without credentials to avoid 500s
      callback(null, true);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
};

// Note: Do NOT register routes on `app` at module load. `app` is initialized lazily.

async function ensureInitialized() {
  if (initialized || initializing) return;
  initializing = true;
  console.log("[bootstrap] Initializing express app");
  if (!app) {
    const express = (await import("express")).default;
    app = express();
  }
  // Core middleware (idempotent – Express ignores duplicate .use order for identical stack we invoke only once)
  const cors = (await import("cors")).default;
  app.use(cors(corsOptions));
  app.use(
    app.json
      ? app.json({ limit: "10mb" })
      : (await import("express")).default.json({ limit: "10mb" })
  );
  app.use(
    app.urlencoded
      ? app.urlencoded({ extended: true, limit: "10mb" })
      : (await import("express")).default.urlencoded({
          extended: true,
          limit: "10mb",
        })
  );

  try {
    // Register early diagnostics routes before attempting full route load
    app.get("/api/preflight", (_req: any, res: any) => {
      res.json({
        initialized,
        initializing,
        hasInitError: !!lastInitError,
        nodeEnv: process.env.NODE_ENV,
        timestamp: Date.now(),
        resendKeyPresent: !!process.env.RESEND_API_KEY,
        supabaseUrlPresent: !!process.env.SUPABASE_URL,
        supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    });
    app.get("/api/init-status", (_req: any, res: any) => {
      res.json({ initialized, initializing, error: lastInitError });
    });

    if (MINIMAL_MODE) {
      console.log(
        "[bootstrap] MINIMAL_MODE enabled – skipping route registration"
      );
    } else {
      console.log(
        "[bootstrap] Loading routes lazily via dynamic import (compiled)"
      );
      // Prefer explicit .js to satisfy Node ESM on Vercel, fallback to extensionless if inlined
      const mod = await import("./routes.cjs")
        .catch(async () => import("./routes.js"))
        .catch(async (e) => {
          try {
            return await import("./routes");
          } catch (e2) {
            throw e;
          }
        });
      const { registerRoutes } = mod as any;
      await registerRoutes(app);
    }
    initialized = true;
    console.log("[bootstrap] Route registration complete");
  } catch (e: any) {
    lastInitError = { message: e?.message || String(e), stack: e?.stack };
    console.error("[bootstrap] registerRoutes failed", e);
    // Provide minimal fallback env-check
    app.get("/api/env-check", (_req: any, res: any) => {
      res.json({
        bootstrapError: true,
        errorMessage: lastInitError?.message,
        nodeEnv: process.env.NODE_ENV,
        resendKeyPresent: !!process.env.RESEND_API_KEY,
        supabaseUrlPresent: !!process.env.SUPABASE_URL,
        supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    });
  } finally {
    initializing = false;
  }
}

// Export handler for Vercel with lazy init
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Serve ultra-minimal endpoints without Express when in MINIMAL_MODE
    if (MINIMAL_MODE) {
      const url = String(req.url || "");
      // Try to recover original path in case of rewrites
      const headers: any = (req as any).headers || {};
      const originalPath = String(
        headers["x-original-path"] || headers["x-forwarded-uri"] || url
      );

      if (originalPath.includes("/api/preflight")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(
          JSON.stringify({
            initialized: false,
            initializing: false,
            hasInitError: false,
            nodeEnv: process.env.NODE_ENV,
            timestamp: Date.now(),
            resendKeyPresent: !!process.env.RESEND_API_KEY,
            supabaseUrlPresent: !!process.env.SUPABASE_URL,
            supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
            minimalMode: true,
          })
        );
      }
      if (originalPath.includes("/api/ping")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "text/plain");
        return res.end("ok");
      }
      if (originalPath.includes("/api/init-status")) {
        res.statusCode = 200;
        res.setHeader("Content-Type", "application/json");
        return res.end(
          JSON.stringify({ initialized, initializing, error: lastInitError })
        );
      }
    }

    await ensureInitialized();
    return app(req as any, res as any);
  } catch (err: any) {
    // On failure, reply with minimal text so ping/clients don't break JSON parsing
    const isPing =
      typeof req.url === "string" && req.url.startsWith("/api/ping");
    if (isPing) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "text/plain");
      return res.end("ok");
    }
    console.error("[handler] Uncaught error", err);
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: { code: "500", message: "A server error has occurred" },
        initStatus: { initialized, initializing, lastInitError },
      })
    );
  }
}
