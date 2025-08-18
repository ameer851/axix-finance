import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method === "GET") {
    res.json({ status: "ok" });
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
