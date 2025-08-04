import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "./routes";
import { corsMiddleware } from "./utils/cors-middleware";

const app = express();

// Initialize the server
let serverInitialized = false;

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (!serverInitialized) {
    // Apply CORS middleware first
    app.use(corsMiddleware);

    // Register all routes
    await registerRoutes(app);
    serverInitialized = true;
  }

  // Convert Vercel request to Express request format
  return new Promise((resolve) => {
    app(req as any, res as any, () => {
      resolve(undefined);
    });
  });
}
