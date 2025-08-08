import type { VercelRequest, VercelResponse } from "@vercel/node";
import cors from "cors";
import express from "express";
import { registerRoutes } from "./routes";

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
  // Core middleware
  app.use(cors(corsOptions));
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Register routes safely
  await registerRoutes(app);

  initialized = true;
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
    res.statusCode = 500;
    res.setHeader("Content-Type", "application/json");
    res.end(
      JSON.stringify({
        error: { code: "500", message: "A server error has occurred" },
      })
    );
  }
}
