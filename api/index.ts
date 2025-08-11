import type { VercelRequest, VercelResponse } from "@vercel/node";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes";

// Early bootstrap log (helps identify cold start vs reuse)
console.log(
  "[bootstrap] Serverless function file loaded at",
  new Date().toISOString()
);

// Create Express app once; initialize lazily on first request
const app = express();
let initialized = false;

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

async function ensureInitialized() {
  if (initialized) return;
  console.log("[bootstrap] Initializing express app");
  // Core middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  try {
    await registerRoutes(app);
    initialized = true;
    console.log("[bootstrap] Route registration complete");
  } catch (e) {
    console.error("[bootstrap] registerRoutes failed", e);
    // Provide minimal fallback endpoints so we can see env presence instead of opaque 500
    app.get("/api/env-check", (_req: any, res: any) => {
      res.json({
        bootstrapError: true,
        errorMessage: (e as any)?.message || String(e),
        nodeEnv: process.env.NODE_ENV,
        resendKeyPresent: !!process.env.RESEND_API_KEY,
        supabaseUrlPresent: !!process.env.SUPABASE_URL,
        supabaseServiceRolePresent: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      });
    });
    // Mark initialized so we don't retry every request (avoids log spam)
    initialized = true;
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
      })
    );
  }
}
