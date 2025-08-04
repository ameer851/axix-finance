import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Simple health check endpoint for Vercel
 * Useful for monitoring and checking deployment status
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();

  res.status(200).json({
    status: "ok",
    timestamp,
    environment: process.env.NODE_ENV || "development",
    version: process.env.npm_package_version || "1.0.0",
    serverTime: timestamp,
    message: "Axix Finance API is operational",
  });
}
