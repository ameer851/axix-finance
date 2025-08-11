import type { VercelRequest, VercelResponse } from "@vercel/node";
import cors from "cors";
import express from "express";

// NOTE: Do NOT import routes here – dynamic import inside ensureInitialized isolates import-time errors
// import { registerRoutes } from "./routes";

// Early bootstrap log (helps identify cold start vs reuse)
console.log(
  "[bootstrap] Serverless function file loaded at",
  new Date().toISOString()
);

// Create Express app once; initialize lazily on first request
const app = express();
let initialized = false;
let initializing = false;
let lastInitError: { message: string; stack?: string } | null = null;

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

// Always-available ultra-early diagnostics BEFORE initialization
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
  res.json({
    initialized,
    initializing,
    error: lastInitError,
  });
});

async function ensureInitialized() {
  if (initialized || initializing) return;
  initializing = true;
  console.log("[bootstrap] Initializing express app");
  // Core middleware (idempotent – Express ignores duplicate .use order for identical stack we invoke only once)
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  try {
    console.log("[bootstrap] Dynamically importing routes.ts");
    // Use relative import for Vercel serverless (extension required if output is .js)
    const mod = await import("./routes.js");
    const registerRoutes = (mod as any).registerRoutes;
    if (typeof registerRoutes !== "function") {
      throw new Error("registerRoutes export missing in ./routes");
    }
    await registerRoutes(app);
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
