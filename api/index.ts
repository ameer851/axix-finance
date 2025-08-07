import type { VercelRequest, VercelResponse } from "@vercel/node";
import express from "express";
import { registerRoutes } from "./routes";

// Create Express app
const app = express();

// Enable JSON parsing
app.use(express.json());

// Register all routes
registerRoutes(app);

// Export handler for Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  // Handle the request using Express
  return new Promise((resolve, reject) => {
    // Set up Express to handle the request
    app(req as any, res as any, (error: any) => {
      if (error) {
        reject(error);
      } else {
        resolve(res);
      }
    });
  });
}
