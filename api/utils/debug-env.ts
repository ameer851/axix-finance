// debug-env.ts
// NOTE: This is for debugging only - REMOVE BEFORE PRODUCTION
import type { Express, Request, Response } from "express";

export function registerDebugRoutes(app: Express) {
  // Debug endpoint to check environment variables (ONLY IN DEVELOPMENT)
  app.get("/api/debug/env", (req: Request, res: Response) => {
    // Only show limited information for security
    const env = {
      NODE_ENV: process.env.NODE_ENV,
      // Show partial keys for debugging
      SUPABASE_URL: process.env.SUPABASE_URL,
      SUPABASE_ANON_KEY: process.env.SUPABASE_ANON_KEY
        ? `${process.env.SUPABASE_ANON_KEY.substring(0, 10)}...`
        : undefined,
      VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY
        ? `${process.env.VITE_SUPABASE_ANON_KEY.substring(0, 10)}...`
        : undefined,
      VITE_FRONTEND_URL: process.env.VITE_FRONTEND_URL,
      FRONTEND_URL: process.env.FRONTEND_URL,
      SITE_URL: process.env.SITE_URL,
      CLIENT_URL: process.env.CLIENT_URL,
    };

    return res.status(200).json({
      env,
      headers: {
        origin: req.headers.origin,
        host: req.headers.host,
        referer: req.headers.referer,
      },
    });
  });
}
