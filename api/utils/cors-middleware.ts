// cors-middleware.ts
import type { VercelRequest, VercelResponse } from "@vercel/node";
import type { NextFunction, Request, Response } from "express";

/**
 * CORS middleware for Vercel serverless functions and Express
 * This adds proper CORS headers to allow requests from your frontend domain
 */
export function corsMiddleware(
  req: VercelRequest | Request,
  res: VercelResponse | Response,
  next: NextFunction | Function
) {
  // Get allowed origins from environment or use defaults
  const allowedOrigins = [
    "https://www.axixfinance.com",
    "https://axixfinance.com",
    "https://axix-finance.vercel.app",
    "http://localhost:4000", // Add local development
    "http://localhost:3000",
    process.env.VITE_FRONTEND_URL || "",
    process.env.FRONTEND_URL || "",
    process.env.CLIENT_URL || "",
    process.env.SITE_URL || "",
  ].filter((origin) => origin); // Remove empty values

  // Get the request origin
  const origin = req.headers.origin;

  // Allow localhost in development
  if (process.env.NODE_ENV === "development" && origin?.includes("localhost")) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
      "Access-Control-Allow-Methods",
      "GET,HEAD,PUT,PATCH,POST,DELETE"
    );
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization"
    );
    if (req.method === "OPTIONS") {
      return res.status(200).end();
    }
    return next();
  }

  // Set CORS headers if the origin matches one of our allowed origins
  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  } else {
    // If no match, allow the first allowed origin
    res.setHeader("Access-Control-Allow-Origin", allowedOrigins[0] || "*");
  }

  // Set other CORS headers
  res.setHeader(
    "Access-Control-Allow-Methods",
    "GET, POST, PUT, DELETE, OPTIONS"
  );
  res.setHeader(
    "Access-Control-Allow-Headers",
    "Content-Type, Authorization, X-Requested-With"
  );
  res.setHeader("Access-Control-Allow-Credentials", "true");

  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  // Continue to the next middleware or route handler
  next();
}
