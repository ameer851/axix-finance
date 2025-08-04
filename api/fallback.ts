import type { VercelRequest, VercelResponse } from "@vercel/node";

/**
 * Fallback API handler for Vercel
 * This file provides a basic API response if the main server isn't available
 */
export default function handler(req: VercelRequest, res: VercelResponse) {
  const timestamp = new Date().toISOString();
  
  // Basic endpoint response
  res.status(200).json({
    status: "ok",
    timestamp,
    message: "Axix Finance API is responding",
    endpoint: req.url,
    method: req.method,
    environment: process.env.NODE_ENV || "production"
  });
}
