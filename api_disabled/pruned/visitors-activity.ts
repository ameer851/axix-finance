import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsMiddleware } from "./lib/middleware/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsMiddleware(req, res);
  if (req.method === "OPTIONS") return;

  try {
    if (req.method === "PUT") {
      return res.status(200).json({ success: true });
    }

    res.setHeader("Allow", "PUT, OPTIONS");
    return res.status(405).json({ error: "Method Not Allowed" });
  } catch (e) {
    console.error("visitors-activity error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
