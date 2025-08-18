import type { VercelRequest, VercelResponse } from "@vercel/node";

export default function handler(req: VercelRequest, res: VercelResponse) {
  res.status(404).json({
    error: "Not Found",
    message: "The requested resource could not be found",
  });
}
