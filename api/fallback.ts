import type { VercelRequest, VercelResponse } from "@vercel/node";

// Fallback handler for unmatched API routes on Vercel.
// Keeps compatibility with pre-deployment check expectations.
export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(404).json({ ok: false, error: "Not Found", route: "fallback" });
}
