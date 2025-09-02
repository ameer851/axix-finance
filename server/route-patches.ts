// route-patches.ts - Direct API route fixes for admin endpoints
import { Express, Request, Response } from "express";
import { requireAdminRole } from "./auth";
import { DatabaseStorage } from "./storage";

// Create a storage instance
const storage = new DatabaseStorage();

// Mock query function for direct database access if needed
async function directQuery(query: string, params: any[] = []) {
  try {
    // Direct DB access patch: storage internal db not exposed in type; using (storage as any).db if present
    const internalDb = (storage as any).db;
    if (!internalDb?.execute) throw new Error("Database not available");
    const result = await internalDb.execute(query, params);
    return result;
  } catch (error) {
    console.error("Direct query error:", error);
    throw error;
  }
}

export function applyRoutePatches(app: Express) {
  console.log("📝 Applying route patches for admin endpoints...");

  // Add compatibility for API calls to ensure they work with both path formats
  app.post("/admin/deposits/:id/approve", (req, res) => {
    console.log(
      "⚠️ Route compatibility patch: redirecting /admin/deposits/:id/approve to /api/admin/deposits/:id/approve"
    );
    // Forward the request to the correct API endpoint
    req.url = `/api/admin/deposits/${req.params.id}/approve`;
    app._router.handle(req, res);
  });

  // Also support /admin/... -> /api/admin/... for other actions
  app.post("/admin/withdrawals/:id/approve", (req, res) => {
    console.log(
      "⚠️ Route compatibility patch: redirecting /admin/withdrawals/:id/approve to /api/admin/withdrawals/:id/approve"
    );
    req.url = `/api/admin/withdrawals/${req.params.id}/approve`;
    app._router.handle(req, res);
  });
  app.post("/admin/deposits/:id/reject", (req, res) => {
    req.url = `/api/admin/deposits/${req.params.id}/reject`;
    app._router.handle(req, res);
  });
  app.post("/admin/withdrawals/:id/reject", (req, res) => {
    req.url = `/api/admin/withdrawals/${req.params.id}/reject`;
    app._router.handle(req, res);
  });
  app.get("/admin/transactions", (req, res) => {
    // Preserve query string
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = `/api/admin/transactions${qs}`;
    app._router.handle(req, res);
  });
  app.get("/admin/user-transactions", (req, res) => {
    // Preserve query string
    const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
    req.url = `/api/admin/user-transactions${qs}`;
    app._router.handle(req, res);
  });

  // Middleware to ensure routes only proceed if explicitly called
  function apiMiddleware(req: Request, res: Response, next: Function) {
    // Set a header to indicate this is a direct API response
    res.setHeader("X-API-Route", "direct");
    next();
  }

  // === CRITICAL FIX: Users endpoint - most important endpoint to fix ===
  app.get(
    "/api/admin/users",
    apiMiddleware,
    requireAdminRole,
    async (req: Request, res: Response) => {
      console.log("👥 Direct route handler: /api/admin/users");
      try {
        // Get query parameters
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const offset = (page - 1) * limit;

        // Get search parameter
        const search = req.query.search as string;

        // Get users with pagination
        const usersPromise = search
          ? storage.searchUsers(search)
          : storage.getUsers({ limit, offset, search });

        // Get total count
        const countPromise = storage.getUserCount();

        // Wait for both promises
        const [users, total] = await Promise.all([usersPromise, countPromise]);

        // Calculate pagination
        const totalPages = Math.ceil(total / limit);

        console.log(
          `👥 Retrieved ${users.length} users (page ${page}/${totalPages})`
        );

        return res.json({
          success: true,
          data: users,
          pagination: {
            total,
            totalPages,
            currentPage: page,
            limit,
          },
        });
      } catch (error) {
        console.error("❌ Error fetching users:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to fetch users",
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }
  );

  // Dashboard stats endpoint
  app.get(
    "/api/admin/dashboard-stats",
    apiMiddleware,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        console.log("📊 Direct route handler: /api/admin/dashboard-stats");

        // Get basic stats
        const userCount = await storage.getUserCount();
        const transactionCount = await storage.getTransactionCount();
        const activeUserCount = await storage.getActiveUserCount();
        const pendingTransactionCount =
          await storage.getPendingTransactionCount();
        // Aggregate activeDeposits sum (best-effort)
        let totalActiveDeposits = 0;
        try {
          const allUsers = await storage.getAllUsers();
          totalActiveDeposits = (allUsers || []).reduce(
            (sum: number, u: any) => sum + Number(u.activeDeposits || 0),
            0
          );
        } catch (e) {
          console.warn("Failed to aggregate activeDeposits", e);
        }

        // Return dashboard stats
        res.json({
          users: {
            total: userCount,
            active: activeUserCount,
          },
          transactions: {
            total: transactionCount,
            pending: pendingTransactionCount,
            activeDeposits: totalActiveDeposits,
          },
          system: {
            status: "operational",
            version: "1.0.0",
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({ error: "Failed to fetch dashboard statistics" });
      }
    }
  );

  // Active visitors endpoint
  app.get(
    "/api/admin/active-visitors",
    apiMiddleware,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        console.log("👁️ Direct route handler: /api/admin/active-visitors");

        // This is a placeholder - implement actual logic if you have visitor tracking
        res.json({
          activeVisitors: [],
          totalCount: 0,
        });
      } catch (error) {
        console.error("Error fetching active visitors:", error);
        res.status(500).json({ error: "Failed to fetch active visitors" });
      }
    }
  );

  // User stats endpoint
  app.get(
    "/api/admin/users/stats",
    apiMiddleware,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        console.log("📊 Direct route handler: /api/admin/users/stats");

        const userCount = await storage.getUserCount();
        const activeUserCount = await storage.getActiveUserCount();

        // Return user stats
        res.json({
          total: userCount,
          verified: userCount, // We're assuming all users are verified with our fix
          unverified: 0, // Since we're bypassing verification
          active: activeUserCount,
          inactive: userCount - activeUserCount,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        res.status(500).json({ error: "Failed to fetch user statistics" });
      }
    }
  );

  // Specific admin API endpoints that might be needed
  app.get(
    "/api/admin/stats/dashboard",
    apiMiddleware,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        console.log("📊 Direct route handler: /api/admin/stats/dashboard");

        // Get basic stats
        const userCount = await storage.getUserCount();
        const transactionCount = await storage.getTransactionCount();

        // Return in the format expected by the frontend
        res.json({
          success: true,
          data: {
            total_users: userCount,
            verified_users: userCount, // All users are verified with our fix
            total_transactions: transactionCount,
            total_transaction_amount: 0, // This would require a specific query
          },
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        res.status(500).json({
          success: false,
          message: "Failed to fetch dashboard statistics",
        });
      }
    }
  );

  console.log("✅ Route patches applied successfully");
}
