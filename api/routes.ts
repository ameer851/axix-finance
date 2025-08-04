// Import minimal routes for Vercel serverless function
import type { Express, Request, Response } from "express";
import express from "express";
import {
  createDeposit,
  createWithdrawal,
  getAdminDashboardData,
  getUserBalance,
  getUserDeposits,
  getUserWithdrawals,
} from "./supabase";
import { registerDebugRoutes } from "./utils/debug-env";
import { registerVisitorsApi } from "./utils/visitors-api";

/**
 * Registers minimal routes for the Vercel serverless function
 * This is a simplified version of the server/routes.ts file
 */
export async function registerRoutes(app: Express) {
  // Use JSON middleware
  app.use(express.json());

  // Register visitors API to fix CORS issues
  registerVisitorsApi(app);

  // Register debug routes if not in production
  if (process.env.NODE_ENV !== "production") {
    registerDebugRoutes(app);
  }

  // Basic health check endpoint
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "API is up and running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Get user balance endpoint - fetches real data from Supabase
  app.get("/api/users/:userId/balance", async (req: Request, res: Response) => {
    try {
      const userId = req.params.userId;

      // Get actual balance from database
      const balanceData = await getUserBalance(userId);

      if (!balanceData) {
        return res.status(404).json({ message: "User or balance not found" });
      }

      return res.status(200).json(balanceData);
    } catch (error) {
      console.error("Get balance error:", error);
      return res.status(500).json({ message: "Failed to get user balance" });
    }
  });

  // Admin dashboard data endpoint
  app.get("/api/admin/dashboard", async (req: Request, res: Response) => {
    try {
      // Verify admin role here
      const user = (req as any).user;
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const dashboardData = await getAdminDashboardData();
      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error("Admin dashboard error:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch admin dashboard data" });
    }
  });

  // Get user deposits endpoint
  app.get(
    "/api/users/:userId/deposits",
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;

        // Get deposits from database
        const deposits = await getUserDeposits(userId);

        if (!deposits) {
          return res.status(404).json({ message: "User deposits not found" });
        }

        return res.status(200).json(deposits);
      } catch (error) {
        console.error("Get deposits error:", error);
        return res.status(500).json({ message: "Failed to get user deposits" });
      }
    }
  );

  // Get user withdrawals endpoint
  app.get(
    "/api/users/:userId/withdrawals",
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;

        // Get withdrawals from database
        const withdrawals = await getUserWithdrawals(userId);

        if (!withdrawals) {
          return res
            .status(404)
            .json({ message: "User withdrawals not found" });
        }

        return res.status(200).json(withdrawals);
      } catch (error) {
        console.error("Get withdrawals error:", error);
        return res
          .status(500)
          .json({ message: "Failed to get user withdrawals" });
      }
    }
  );

  // Create deposit endpoint
  app.post(
    "/api/users/:userId/deposits",
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;
        const { amount, method, reference } = req.body;

        if (!amount || !method) {
          return res
            .status(400)
            .json({ message: "Amount and method are required" });
        }

        // Create deposit in database
        const deposit = await createDeposit(
          userId,
          Number(amount),
          method,
          reference || ""
        );

        if (!deposit) {
          return res.status(500).json({ message: "Failed to create deposit" });
        }

        return res.status(201).json(deposit);
      } catch (error) {
        console.error("Create deposit error:", error);
        return res.status(500).json({ message: "Failed to create deposit" });
      }
    }
  );

  // Create withdrawal endpoint
  app.post(
    "/api/users/:userId/withdrawals",
    async (req: Request, res: Response) => {
      try {
        const userId = req.params.userId;
        const { amount, method, address } = req.body;

        if (!amount || !method || !address) {
          return res
            .status(400)
            .json({ message: "Amount, method, and address are required" });
        }

        // Create withdrawal in database
        const withdrawal = await createWithdrawal(
          userId,
          Number(amount),
          method,
          address
        );

        if (!withdrawal) {
          return res
            .status(500)
            .json({ message: "Failed to create withdrawal" });
        }

        return res.status(201).json(withdrawal);
      } catch (error) {
        console.error("Create withdrawal error:", error);
        return res.status(500).json({ message: "Failed to create withdrawal" });
      }
    }
  );

  // Default route handler
  app.use("*", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "Axix Finance API",
      endpoint: req.originalUrl || req.url,
      method: req.method,
      timestamp: new Date().toISOString(),
    });
  });
}
