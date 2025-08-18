import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsMiddleware } from "./lib/middleware/cors";

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS middleware
  corsMiddleware(req, res, () => {
    if (req.method === "GET") {
      // Handle the /api/ping request
      res.json({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || "production",
      });
    } else {
      res.status(405).json({ error: "Method not allowed" });
    }
  });
}
