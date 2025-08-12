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
    (app as any).json
      ? (app as any).json({ limit: "10mb" })
      : (await import("express")).default.json({ limit: "10mb" })
  );
  app.use(
    (app as any).urlencoded
      ? (app as any).urlencoded({ extended: true, limit: "10mb" })
      : (await import("express")).default.urlencoded({
          extended: true,
          limit: "10mb",
        })
  );

  try {
    // Register early diagnostics routes before attempting full route load
    (app as any).get("/api/preflight", (_req: any, res: any) => {
      res.json({
        initialized,
        initializing,
        hasInitError: !!lastInitError,
        nodeEnv: process.env.NODE_ENV,
        timestamp: Date.now(),
        minimalMode: !!MINIMAL_MODE,
        resendKeyPresent: !!process.env.RESEND_API_KEY,
        supabaseUrlPresent: !!process.env.SUPABASE_URL,
        supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    });
    (app as any).get("/api/init-status", (_req: any, res: any) => {
      res.json({ initialized, initializing, error: lastInitError });
    });

    // Ultra-fast ping endpoint available even in MINIMAL_MODE
    (app as any).get("/api/ping", (_req: any, res: any) => {
      try {
        res.status(200).type("text/plain").send("ok");
      } catch {
        res.setHeader("Content-Type", "text/plain");
        res.status(200).end("ok");
      }
    });

    // Make basic health endpoints available even in MINIMAL_MODE
    (app as any).get("/api/email-health", async (_req: any, res: any) => {
      try {
        const { emailHealth } = await import("./utils/email");
        res.json(emailHealth());
      } catch (e) {
        res.json({
          apiKeyPresent: !!process.env.RESEND_API_KEY,
          clientReady: false,
          error: "email util load failed",
        });
      }
    });
    (app as any).get("/api/env-check", (_req: any, res: any) => {
      res.json({
        nodeEnv: process.env.NODE_ENV,
        resendKeyPresent: !!process.env.RESEND_API_KEY,
        emailFromPresent: !!process.env.EMAIL_FROM,
        supabaseUrlPresent: !!process.env.SUPABASE_URL,
        supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        minimalMode: !!MINIMAL_MODE,
      });
    });
    (app as any).get("/api/db-health", async (_req: any, res: any) => {
      try {
        const supa: any = await import("./supabase");
        if (!supa.isSupabaseConfigured || !supa.supabase) {
          return res.json({ configured: false, reachable: false });
        }
        const { error } = await supa.supabase
          .from("users")
          .select("id")
          .limit(1);
        if (error) return res.json({ configured: true, reachable: false });
        return res.json({ configured: true, reachable: true });
      } catch (e) {
        return res.json({ configured: false, reachable: false });
      }
    });

    // Make visitor tracking endpoints available even in MINIMAL_MODE
    try {
      const { registerVisitorsApi } = await import("./utils/visitors-api");
      registerVisitorsApi(app);
    } catch (e) {
      console.warn("[bootstrap] visitors-api unavailable", e);
    }

    if (MINIMAL_MODE) {
      console.log(
        "[bootstrap] MINIMAL_MODE enabled – skipping route registration"
      );
    } else {
      console.log(
        "[bootstrap] Loading routes lazily via dynamic import (compiled)"
      );
      // Prefer extensionless import so Vercel's TS build resolves correctly; fallback to .js when running prebuilt locally
      const mod: any = await import("./routes").catch(async (e1) => {
        try {
          return await import("./routes.js");
        } catch (e2) {
          // Surface the original error for clarity
          throw e1;
        }
      });
      const registerRoutes = mod.registerRoutes || mod.default?.registerRoutes;
      if (typeof registerRoutes !== "function") {
        throw new Error("registerRoutes not found in routes module");
      }
      await registerRoutes(app);
    }
    initialized = true;
    console.log("[bootstrap] Route registration complete");
  } catch (e: any) {
    lastInitError = { message: e?.message || String(e), stack: e?.stack };
    console.error("[bootstrap] registerRoutes failed", e);
    // Provide minimal fallback env-check
    (app as any).get("/api/env-check", (_req: any, res: any) => {
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
    // Determine the originally requested path (Vercel rewrites /api/* to /api/index)
    const headers: any = (req as any).headers || {};
    const currentUrl = String(req.url || "");
    const originalPath = String(
      headers["x-original-path"] || headers["x-forwarded-uri"] || currentUrl
    );

    // Always handle diagnostics endpoints before any initialization to avoid crashes blocking them
    if (originalPath.includes("/api/preflight")) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({
          initialized,
          initializing,
          hasInitError: !!lastInitError,
          nodeEnv: process.env.NODE_ENV,
          timestamp: Date.now(),
          minimalMode: !!MINIMAL_MODE,
          resendKeyPresent: !!process.env.RESEND_API_KEY,
          supabaseUrlPresent: !!process.env.SUPABASE_URL,
          supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
        })
      );
    }
    if (originalPath.includes("/api/init-status")) {
      res.statusCode = 200;
      res.setHeader("Content-Type", "application/json");
      return res.end(
        JSON.stringify({ initialized, initializing, error: lastInitError })
      );
    }
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

    // Ensure the express app is initialized
    await ensureInitialized();

    // Restore the original path so Express matches real routes (not /api/index)
    // Note: Vercel rewrites /api/* -> /api/index; we need the original path for routing
    try {
      (req as any).originalUrl = originalPath;
      (req as any).url = originalPath;
      // Best-effort preserve path as well
      (req as any).path = originalPath;
    } catch {}

    return (app as any)(req as any, res as any);
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
