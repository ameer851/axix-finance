// Import minimal routes for Vercel serverless function
import type { Express, Request, Response } from "express";
import express from "express";

/**
 * Registers minimal routes for the Vercel serverless function
 * This is a simplified version of the server/routes.ts file
 */
export async function registerRoutes(app: Express) {
  // Use JSON middleware
  app.use(express.json());
  
  // Basic health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "API is up and running",
      timestamp: new Date().toISOString(),
      version: "1.0.0"
    });
  });

  // Add user balance endpoint
  app.get("/api/users/:userId/balance", (req: Request, res: Response) => {
    try {
      // Return dummy balance data for all users
      return res.status(200).json({
        availableBalance: 10000,
        pendingBalance: 0,
        totalBalance: 10000,
        lastUpdated: new Date().toISOString()
      });
    } catch (error) {
      console.error("Get balance error:", error);
      return res.status(500).json({ message: "Failed to get user balance" });
    }
  });

  // Default route handler
  app.use("*", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Axix Finance API",
      endpoint: req.originalUrl || req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });

  // Default route handler
  app.use("*", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Axix Finance API",
      endpoint: req.originalUrl || req.url,
      method: req.method,
      timestamp: new Date().toISOString()
    });
  });
}
