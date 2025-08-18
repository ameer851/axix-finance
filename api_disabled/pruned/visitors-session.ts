import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsMiddleware } from "./lib/middleware/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Apply CORS
  corsMiddleware(req, res);
  if (req.method === "OPTIONS") return; // corsMiddleware already ended it

  try {
    if (req.method === "POST") {
      // Initialize visitor session
      return res.status(200).json({ success: true });
    }

    if (req.method === "DELETE") {
      // End visitor session
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", "POST, DELETE, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("visitors-session error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
