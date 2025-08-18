import type { VercelRequest, VercelResponse } from "@vercel/node";

export function corsMiddleware(
  req: VercelRequest,
  res: VercelResponse,
  next?: () => void
) {
  // Set CORS headers
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization"
  );

  // Handle OPTIONS method
  if (req.method === "OPTIONS") {
    res.status(200).end();
    return;
  }

  // Move to next middleware/handler if provided
  if (next) {
    next();
  }
}
