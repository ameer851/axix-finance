// Import minimal routes for Vercel serverless function
import type { Express, Request, Response } from "express";
import express from "express";
import {
  RequestWithAuth as AuthenticatedRequest,
  requireAuth,
} from "./middleware/auth-middleware";
import {
  approveDeposit,
  approveWithdrawal,
  createDeposit,
  createWithdrawal,
  getAdminDashboardData,
  getAdminDeposits,
  getAdminWithdrawals,
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

  // Simple root endpoint to test API connectivity
  app.get("/", (req, res) => {
    res.status(200).json({
      message: "Axix Finance API is running",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development",
    });
  });

  // Ultra-fast ping endpoint (no JSON/DB) for connectivity checks
  app.get("/api/ping", (_req, res) => {
    try {
      res.status(200).type("text/plain").send("ok");
    } catch {
      // ensure a minimal body even if Express throws
      res.setHeader("Content-Type", "text/plain");
      res.status(200).end("ok");
    }
  });

  // Basic health check endpoint (no auth required)
  app.get("/api/health", (req, res) => {
    res.status(200).json({
      status: "ok",
      message: "API is up and running",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  });

  // Proxy Google Translate log to avoid CORS issues
  app.get("/api/translate-log", async (req: Request, res: Response) => {
    try {
      const targetBase =
        "https://translate.googleapis.com/element/log?format=json";
      const qs = new URLSearchParams(req.query as any).toString();
      const url = qs ? `${targetBase}&${qs}` : targetBase;
      const response = await fetch(
        url as any,
        {
          headers: { "User-Agent": "AxixFinanceServerless/1.0" },
        } as any
      );
      const text = await response.text();
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.setHeader("Content-Type", "application/json");
      try {
        const json = text ? JSON.parse(text) : null;
        res.status(response.status).json(json);
      } catch {
        res.status(response.status).send(text);
      }
    } catch (err) {
      console.error("translate-log proxy error", err);
      res.setHeader("Access-Control-Allow-Origin", "*");
      res.status(500).json({
        error: "translate_log_failed",
        message: "Failed to fetch translate log",
      });
    }
  });

  // Get user balance endpoint - requires authentication
  app.get(
    "/api/users/:userId/balance",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.params.userId;

        // Verify user is requesting their own data or is admin
        if (
          req.authUser?.id !== parseInt(userId) &&
          req.authUser?.role !== "admin"
        ) {
          return res.status(403).json({ message: "Unauthorized access" });
        }

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
    }
  );

  // Admin dashboard data endpoint
  app.get(
    "/api/admin/dashboard",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (req.authUser?.role !== "admin") {
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
    }
  );

  // Admin deposits endpoint
  app.get(
    "/api/admin/deposits",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (req.authUser?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }

        const { status, dateFrom, dateTo, amountMin, amountMax } = req.query;

        const deposits = await getAdminDeposits({
          status: status as string,
          dateFrom: dateFrom as string,
          dateTo: dateTo as string,
          amountMin: amountMin ? Number(amountMin) : undefined,
          amountMax: amountMax ? Number(amountMax) : undefined,
        });

        if (!deposits) {
          return res.status(500).json({ message: "Failed to fetch deposits" });
        }

        return res.status(200).json(deposits);
      } catch (error) {
        console.error("Admin deposits error:", error);
        return res.status(500).json({ message: "Failed to fetch deposits" });
      }
    }
  );

  // Admin approve deposit endpoint
  app.post(
    "/api/admin/deposits/:id/approve",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (req.authUser?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }

        const success = await approveDeposit(req.params.id);

        if (!success) {
          return res.status(500).json({ message: "Failed to approve deposit" });
        }

        return res
          .status(200)
          .json({ message: "Deposit approved successfully" });
      } catch (error) {
        console.error("Admin approve deposit error:", error);
        return res.status(500).json({ message: "Failed to approve deposit" });
      }
    }
  );

  // Admin withdrawals endpoint
  app.get(
    "/api/admin/withdrawals",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (req.authUser?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }

        const { status, dateFrom, dateTo, amountMin, amountMax } = req.query;

        const withdrawals = await getAdminWithdrawals({
          status: status as string,
          dateFrom: dateFrom as string,
          dateTo: dateTo as string,
          amountMin: amountMin ? Number(amountMin) : undefined,
          amountMax: amountMax ? Number(amountMax) : undefined,
        });

        if (!withdrawals) {
          return res
            .status(500)
            .json({ message: "Failed to fetch withdrawals" });
        }

        return res.status(200).json(withdrawals);
      } catch (error) {
        console.error("Admin withdrawals error:", error);
        return res.status(500).json({ message: "Failed to fetch withdrawals" });
      }
    }
  );

  // Admin approve withdrawal endpoint
  app.post(
    "/api/admin/withdrawals/:id/approve",
    requireAuth,
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        if (req.authUser?.role !== "admin") {
          return res.status(403).json({ message: "Admin access required" });
        }

        const success = await approveWithdrawal(req.params.id);

        if (!success) {
          return res
            .status(500)
            .json({ message: "Failed to approve withdrawal" });
        }

        return res
          .status(200)
          .json({ message: "Withdrawal approved successfully" });
      } catch (error) {
        console.error("Admin approve withdrawal error:", error);
        return res
          .status(500)
          .json({ message: "Failed to approve withdrawal" });
      }
    }
  );

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
