import type { VercelRequest, VercelResponse } from "@vercel/node";
import { corsMiddleware } from "./lib/middleware/cors";

export default async function handler(req: VercelRequest, res: VercelResponse) {
  corsMiddleware(req, res);
  if (req.method === "OPTIONS") return;

  try {
    if (req.method !== "POST") {
      res.setHeader("Allow", "POST, OPTIONS");
      return res.status(405).json({ error: "Method Not Allowed" });
    }
    // Generic message to avoid leaking details
    return res.status(200).json({
      code: "login_failed",
      message: "Invalid username or password.",
    });
  } catch (e) {
    console.error("auth-diagnose-login error:", e);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
