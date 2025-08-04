// admin-panel.ts - Direct implementation of admin panel endpoints
import express, { NextFunction, Request, Response, Router } from "express";
import { generateDemoLogs } from "./admin-panel-helpers";
import {
  AdminRequest,
  AdminRequestUser,
  GetTransactionsOptions,
  PaginationResponse,
} from "./interfaces/admin";
import { DatabaseStorage } from "./storage/admin-storage";

// Helper function to type check and handle errors
function isError(error: unknown): error is Error {
  return error instanceof Error;
}

function handleErrorResponse(error: unknown) {
  if (isError(error)) {
    return {
      success: false,
      message: error.message,
    };
  }
  return {
    success: false,
    message: "An unknown error occurred",
  };
}

// Create a simple authentication middleware that doesn't require email verification
function basicAuthCheck(req: Request, res: Response, next: NextFunction) {
  if (!(req as any).isAuthenticated()) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  // Always proceed - no email verification check
  next();
}

// Create a simple admin check that doesn't require email verification
function basicAdminCheck(req: Request, res: Response, next: NextFunction) {
  // Type guards for error handling
  function isError(error: unknown): error is Error {
    return error instanceof Error;
  }

  function handleError(error: unknown) {
    if (isError(error)) {
      return {
        success: false,
        message: error.message,
      };
    }
    return {
      success: false,
      message: "An unknown error occurred",
    };
  }

  if (!(req as any).isAuthenticated()) {
    return res
      .status(401)
      .json({ success: false, message: "Authentication required" });
  }

  const user = (req as any).user as AdminRequestUser;

  // Check if user has admin role, but don't check email verification
  if (user.role !== "admin") {
    return res
      .status(403)
      .json({ success: false, message: "Admin access required" });
  }

  // User is admin, proceed
  next();
}

// Create a storage instance for database operations
const storage = new DatabaseStorage();

// Create a storage instance for database operations

export function createAdminRouter(): Router {
  const router = Router();

  // Log all admin requests for debugging
  router.use((req, res, next) => {
    console.log(`🔐 Admin API request: ${req.method} ${req.path}`);
    next();
  });

  // Apply the basic admin check to all routes
  router.use(basicAuthCheck);
  router.use(basicAdminCheck);

  // === Users Management Endpoints ===

  // Get all users
  router.get("/users", async (req: Request, res: Response) => {
    try {
      console.log("👥 Admin API: Getting users list");

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;

      // Get users with pagination
      const usersPromise = search
        ? storage.searchUsers(search)
        : storage.getUsers({ limit, offset, search });

      // Get total count
      const countPromise = storage.getUserCount();

      // Wait for both promises
      const [users, count] = await Promise.all([usersPromise, countPromise]);

      res.json({
        success: true,
        data: users,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error getting users:", error);
      res.status(500).json(handleErrorResponse(error));
    }
  });

  // === Dashboard Statistics Endpoints ===

  // Get statistics for the admin dashboard
  router.get("/stats/dashboard", async (req: Request, res: Response) => {
    try {
      console.log("📊 Admin API: Getting dashboard stats");

      // Get various counts from storage
      const userCountPromise = storage.getUserCount();
      const pendingVerificationsPromise = storage.getPendingVerificationCount();
      const pendingDepositsPromise = storage.getPendingDepositCount();
      const pendingWithdrawalsPromise = storage.getPendingWithdrawalCount();
      const totalDepositAmountPromise = storage.getTotalDepositAmount();
      const totalWithdrawalAmountPromise = storage.getTotalWithdrawalAmount();

      // Wait for all promises to resolve
      const [
        userCount,
        pendingVerifications,
        pendingDeposits,
        pendingWithdrawals,
        totalDepositAmount,
        totalWithdrawalAmount,
      ] = await Promise.all([
        userCountPromise,
        pendingVerificationsPromise,
        pendingDepositsPromise,
        pendingWithdrawalsPromise,
        totalDepositAmountPromise,
        totalWithdrawalAmountPromise,
      ]);

      // Calculate profit (total deposits - total withdrawals)
      const profit = totalDepositAmount - totalWithdrawalAmount;

      // Send the compiled statistics
      res.json({
        success: true,
        data: {
          users: {
            total: userCount,
            pendingVerification: pendingVerifications,
          },
          transactions: {
            pendingDeposits,
            pendingWithdrawals,
            totalDeposits: totalDepositAmount,
            totalWithdrawals: totalWithdrawalAmount,
            profit,
          },
        },
      });
    } catch (error) {
      console.error("❌ Error getting dashboard stats:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get dashboard stats",
        error: isError(error) ? error.message : "Unknown error",
      });
    }
  });

  // Get recent activity for the admin dashboard
  router.get("/stats/recent-activity", async (req: Request, res: Response) => {
    try {
      console.log("📈 Admin API: Getting recent activity");

      // Get recent activities from storage
      const recentTransactions = await storage.getRecentTransactions(10);
      const recentLogins = await storage.getRecentLogins(10);
      const recentRegistrations = await storage.getRecentRegistrations(10);

      // Send the compiled activities
      res.json({
        success: true,
        data: {
          transactions: recentTransactions,
          logins: recentLogins,
          registrations: recentRegistrations,
        },
      });
    } catch (error) {
      console.error("❌ Error getting recent activity:", error);
      res.status(500).json(handleErrorResponse(error));
    }
  });

  // === Transaction Management Endpoints ===

  // Get all transactions
  router.get("/transactions", async (req: AdminRequest, res: Response) => {
    try {
      console.log("💰 Admin API: Getting transactions list");

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const status = req.query.status as string;
      const type = req.query.type as string;
      const dateFrom = req.query.dateFrom as string;
      const dateTo = req.query.dateTo as string;

      // Prepare options object
      const options: GetTransactionsOptions = {
        limit,
        offset,
        ...(search && { search }),
        ...(status && { status }),
        ...(type && { type }),
        ...(dateFrom && dateTo && { dateFrom, dateTo }),
      };

      // Get transactions and count with filters
      const [transactionResults, totalCount] = await Promise.all([
        storage.getTransactions(options),
        storage.getTransactionCount(options),
      ]);

      const response: PaginationResponse<(typeof transactionResults)[0]> = {
        success: true,
        data: transactionResults,
        pagination: {
          page,
          limit,
          total: totalCount,
          pages: Math.ceil(totalCount / limit),
        },
      };

      res.json(response);
    } catch (error) {
      console.error("❌ Error getting transactions:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get transactions",
        error: isError(error) ? error.message : "Unknown error",
      });
    }
  });

  // Get pending deposits
  router.get("/deposits/pending", async (req: AdminRequest, res: Response) => {
    try {
      console.log("💲 Admin API: Getting pending deposits");

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;
      const offset = (page - 1) * limit;

      // Get pending deposits with pagination
      const pendingDepositsPromise = storage.getPendingDeposits({
        limit,
        offset,
      });

      // Get total count
      const countPromise = storage.getPendingDepositCount();

      // Wait for both promises
      const [pendingDeposits, count] = await Promise.all([
        pendingDepositsPromise,
        countPromise,
      ]);

      res.json({
        success: true,
        data: pendingDeposits,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error getting pending deposits:", error);
      res.status(500).json({
        success: false,
        message: "Failed to get pending deposits",
        error: isError(error) ? error.message : "Unknown error",
      });
    }
  });

  // Ensure proper error handling and response structure
  router.post(
    "/deposits/:id/approve",
    async (req: AdminRequest, res: Response) => {
      try {
        console.log(`🔄 Admin API: Approving deposit with ID ${req.params.id}`);
        const depositId = parseInt(req.params.id);

        if (isNaN(depositId)) {
          return res
            .status(400)
            .json({ success: false, message: "Invalid deposit ID format" });
        }

        let deposit;
        try {
          deposit = await storage.getTransactionById(depositId);
        } catch (dbError) {
          console.error(
            `Database error getting transaction: ${isError(dbError) ? dbError.message : "Unknown error"}`
          );
          return res.status(500).json({
            success: false,
            message: "Error retrieving deposit information",
          });
        }

        if (!deposit) {
          console.log(`❌ Deposit with ID ${depositId} not found`);
          return res
            .status(404)
            .json({ success: false, message: "Deposit not found" });
        }

        console.log(`✅ Found deposit: ${JSON.stringify(deposit)}`);

        if (deposit.type !== "deposit") {
          return res.status(400).json({
            success: false,
            message: `Transaction is not a deposit (type: ${deposit.type})`,
          });
        }

        if (deposit.status === "completed") {
          return res.json({
            success: true,
            message: "Deposit was already approved",
            data: deposit,
          });
        }

        let updated;
        try {
          updated = await storage.updateTransactionStatus(
            depositId,
            "completed"
          );
        } catch (updateError) {
          console.error(
            `Error updating transaction status: ${isError(updateError) ? updateError.message : "Unknown error"}`
          );
          return res
            .status(500)
            .json({ success: false, message: "Error updating deposit status" });
        }

        if (updated) {
          try {
            await storage.createNotification({
              userId: deposit.userId,
              type: "transaction",
              title: "Deposit Approved",
              message: `Your deposit of $${deposit.amount} has been approved and added to your account.`,
              relatedEntityType: "transaction",
              relatedEntityId: depositId,
            });
            console.log(`✉️ Notification sent to user ${deposit.userId}`);
          } catch (notifyError) {
            console.error(
              "Failed to send notification, but deposit was approved:",
              notifyError
            );
          }

          return res.json({
            success: true,
            message: "Deposit approved successfully",
            data: updated,
          });
        } else {
          return res.status(500).json({
            success: false,
            message: "Failed to approve deposit",
          });
        }
      } catch (error) {
        console.error("❌ Error approving deposit:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to approve deposit",
          error: isError(error) ? error.message : "Unknown error",
        });
      }
    }
  );

  // Audit logs endpoint
  router.get("/audit-logs", async (req: AdminRequest, res: Response) => {
    try {
      console.log("📋 Admin API: Getting audit logs");

      // Parse query parameters
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = (page - 1) * limit;
      const search = req.query.search as string;
      const action = req.query.action as string;

      // Get logs with filters and pagination
      let logs = [];
      let count = 0;

      try {
        logs = await storage.getAuditLogs({ limit, offset, search, action });
        count = await storage.getAuditLogCount({ search, action });
      } catch (dbError) {
        console.warn(
          "Failed to get audit logs from database, using demo data:",
          dbError
        );

        // Generate demo logs if the database query failed
        const demoLogs = generateDemoLogs(50);
        logs = demoLogs.slice(offset, offset + limit);
        count = demoLogs.length;
      }

      res.json({
        success: true,
        data: logs,
        pagination: {
          page,
          limit,
          total: count,
          pages: Math.ceil(count / limit),
        },
      });
    } catch (error) {
      console.error("❌ Error getting audit logs:", error);
      res.status(500).json(handleErrorResponse(error));
    }
  });

  // Active visitors endpoint
  router.get(
    "/stats/active-visitors",
    async (req: AdminRequest, res: Response) => {
      try {
        console.log("👁️ Admin API: Getting active visitors");

        // Try to get active visitors from storage
        let visitors = [];

        try {
          visitors = await storage.getActiveVisitors();
        } catch (dbError) {
          console.warn(
            "Failed to get active visitors from database, using demo data:",
            dbError
          );

          // Generate demo visitors data if the database query failed
          visitors = [
            {
              id: 1,
              username: "user1",
              lastActive: new Date(),
              currentPath: "/dashboard",
            },
            {
              id: 2,
              username: "user2",
              lastActive: new Date(),
              currentPath: "/portfolio",
            },
            {
              id: 3,
              username: "user3",
              lastActive: new Date(),
              currentPath: "/deposit",
            },
            {
              id: 4,
              username: "guest_user",
              lastActive: new Date(),
              currentPath: "/",
            },
          ];
        }

        res.json({
          success: true,
          data: visitors,
          count: visitors.length,
        });
      } catch (error) {
        console.error("❌ Error getting active visitors:", error);
        res.status(500).json({
          success: false,
          message: "Failed to get active visitors",
          error: isError(error) ? error.message : "Unknown error",
        });
      }
    }
  );

  return router;
}

export function setupAdminPanel(app: express.Express): void {
  console.log("🔧 Setting up dedicated admin panel routes");

  // Create the admin router
  const adminRouter = createAdminRouter();

  // Mount the admin router at /api/admin
  app.use("/api/admin", adminRouter);

  console.log("✅ Admin panel routes configured");
}
