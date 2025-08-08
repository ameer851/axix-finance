import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(_req: VercelRequest, res: VercelResponse) {
  try {
    res.status(200).setHeader("Content-Type", "text/plain").send("ok");
  } catch {
    // Ensure we still return a minimal body even if send() is unavailable
    res.statusCode = 200;
    res.setHeader("Content-Type", "text/plain");
    res.end("ok");
  }
}
