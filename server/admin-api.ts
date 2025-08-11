import { User as DrizzleUser } from "@shared/schema";
import express, { Request, Response, Router } from "express";
import { requireAdminRole } from "./auth";
import {
  isConfigured as isEmailConfigured,
  sendDepositApprovedEmail,
  sendWithdrawalApprovedEmail,
} from "./emailService";
import { DatabaseStorage } from "./storage";

// Minimal, auditable admin API.
// Routes:
//  GET    /api/admin/health
//  GET    /api/admin/users
//  POST   /api/admin/deposits/:id/approve
//  POST   /api/admin/withdrawals/:id/approve
// All require admin role. Safe to extend incrementally.

const storage = new DatabaseStorage();

interface RouteSpec {
  method: string;
  path: string;
  registrar: (r: Router) => void;
}

function routeAlreadyRegistered(
  app: express.Express,
  method: string,
  fullPath: string
) {
  try {
    const stack: any[] = (app as any)?._router?.stack || [];
    return stack.some((layer) => {
      if (!layer.route) return false;
      const paths: string[] = Array.isArray(layer.route.path)
        ? layer.route.path
        : [layer.route.path];
      const methods = layer.route.methods || {};
      return paths.includes(fullPath) && methods[method.toLowerCase()];
    });
  } catch {
    return false;
  }
}

export function createAdminApiRouter(app: express.Express): Router {
  const router = Router();
  // Debug middleware to inspect auth context before role check
  router.use((req, _res, next) => {
    if (process.env.NODE_ENV !== "production") {
      console.log("[admin-api] incoming", req.method, req.path, {
        hasSessionUser: !!req.user,
        authHeader: req.headers.authorization?.split(" ")[0] || null,
        cookie: req.headers.cookie ? "present" : "none",
      });
    }
    next();
  });
  router.use(requireAdminRole as any);

  const routes: RouteSpec[] = [
    {
      method: "GET",
      path: "/health",
      registrar: (r) => {
        r.get("/health", (_req: Request, res: Response) => {
          res.json({
            status: "ok",
            scope: "admin",
            time: new Date().toISOString(),
          });
        });
      },
    },
    {
      method: "GET",
      path: "/debug/session",
      registrar: (r) => {
        r.get("/debug/session", (req: Request, res: Response) => {
          res.json({
            hasUser: !!req.user,
            user: req.user
              ? { id: req.user.id, role: (req.user as any).role }
              : null,
            sessionKeys: Object.keys((req as any).session || {}),
            session: (req as any).session || null,
            headers: {
              cookie: req.headers.cookie ? true : false,
              authorization: req.headers.authorization || null,
            },
          });
        });
      },
    },
    {
      method: "GET",
      path: "/users",
      registrar: (r) => {
        r.get("/users", async (req: Request, res: Response) => {
          try {
            const page = parseInt((req.query.page as string) || "1", 10) || 1;
            const limit = Math.min(
              100,
              parseInt((req.query.limit as string) || "10", 10) || 10
            );
            const offset = (page - 1) * limit;
            const search = (req.query.search as string) || undefined;

            const usersPromise = search
              ? storage.searchUsers(search)
              : storage.getUsers({ limit, offset, search });
            const countPromise = storage.getUserCount();
            const [users, total] = await Promise.all([
              usersPromise,
              countPromise,
            ]);
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
              success: true,
              data: users,
              pagination: { total, totalPages, currentPage: page, limit },
            });
          } catch (error: any) {
            console.error("Admin users fetch error:", error);
            res
              .status(500)
              .json({ success: false, message: "Failed to fetch users" });
          }
        });
        // Legacy alias: /users/list -> same payload
        r.get("/users/list", async (req: Request, res: Response) => {
          try {
            const page = parseInt((req.query.page as string) || "1", 10) || 1;
            const limit = Math.min(
              100,
              parseInt((req.query.limit as string) || "10", 10) || 10
            );
            const offset = (page - 1) * limit;
            const search = (req.query.search as string) || undefined;
            const usersPromise = search
              ? storage.searchUsers(search)
              : storage.getUsers({ limit, offset, search });
            const countPromise = storage.getUserCount();
            const [users, total] = await Promise.all([
              usersPromise,
              countPromise,
            ]);
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
              success: true,
              data: users,
              pagination: { total, totalPages, currentPage: page, limit },
              alias: true,
            });
          } catch (error: any) {
            console.error("Admin users (alias) fetch error:", error);
            res
              .status(500)
              .json({ success: false, message: "Failed to fetch users" });
          }
        });
      },
    },
    {
      method: "POST",
      path: "/deposits/:id/approve",
      registrar: (r) => {
        r.post("/deposits/:id/approve", async (req: Request, res: Response) => {
          try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id))
              return res.status(400).json({ error: "Invalid ID" });
            const tx = await storage.getTransaction(id);
            if (!tx)
              return res.status(404).json({ error: "Transaction not found" });
            if (tx.type !== "deposit")
              return res
                .status(400)
                .json({ error: "Not a deposit transaction" });
            if (tx.status === "completed")
              return res.json({ success: true, message: "Already approved" });
            const updated = await storage.updateTransactionStatus(
              id,
              "completed"
            );
            try {
              const userRaw = await storage.getUser(tx.userId);
              if (userRaw) {
                const user: DrizzleUser = {
                  id: userRaw.id,
                  uid: (userRaw as any).uid || "",
                  email: userRaw.email,
                  username: null,
                  password: null,
                  firstName: null,
                  lastName: null,
                  full_name: null,
                  balance: null,
                  role: "user",
                  is_admin: false,
                  isVerified: false,
                  isActive: true,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  passwordResetToken: null,
                  passwordResetTokenExpiry: null,
                  verificationToken: null,
                  verificationTokenExpiry: null,
                  twoFactorEnabled: false,
                  twoFactorSecret: null,
                  referredBy: null,
                  pendingEmail: null,
                  bitcoinAddress: null,
                  bitcoinCashAddress: null,
                  ethereumAddress: null,
                  usdtTrc20Address: null,
                  bnbAddress: null,
                };
                await sendDepositApprovedEmail(
                  user,
                  tx.amount,
                  tx.description || "Investment Deposit"
                );
              }
            } catch (emailErr) {
              console.error(
                "Deposit approval email failed (non-fatal):",
                emailErr
              );
            }
            res.json({
              success: true,
              message: "Deposit approved",
              data: updated,
            });
          } catch (error) {
            console.error("Error approving deposit:", error);
            res.status(500).json({ error: "Internal server error" });
          }
        });
      },
    },
    {
      method: "POST",
      path: "/withdrawals/:id/approve",
      registrar: (r) => {
        r.post(
          "/withdrawals/:id/approve",
          async (req: Request, res: Response) => {
            try {
              const id = parseInt(req.params.id, 10);
              if (Number.isNaN(id))
                return res.status(400).json({ error: "Invalid ID" });
              const tx = await storage.getTransaction(id);
              if (!tx)
                return res.status(404).json({ error: "Transaction not found" });
              if (tx.type !== "withdrawal")
                return res
                  .status(400)
                  .json({ error: "Not a withdrawal transaction" });
              if (tx.status === "completed")
                return res.json({ success: true, message: "Already approved" });
              const updated = await storage.updateTransactionStatus(
                id,
                "completed"
              );
              try {
                const userRaw = await storage.getUser(tx.userId);
                if (userRaw) {
                  const user: DrizzleUser = {
                    id: userRaw.id,
                    uid: (userRaw as any).uid || "",
                    email: userRaw.email,
                    username: null,
                    password: null,
                    firstName: null,
                    lastName: null,
                    full_name: null,
                    balance: null,
                    role: "user",
                    is_admin: false,
                    isVerified: false,
                    isActive: true,
                    createdAt: new Date(),
                    updatedAt: new Date(),
                    passwordResetToken: null,
                    passwordResetTokenExpiry: null,
                    verificationToken: null,
                    verificationTokenExpiry: null,
                    twoFactorEnabled: false,
                    twoFactorSecret: null,
                    referredBy: null,
                    pendingEmail: null,
                    bitcoinAddress: null,
                    bitcoinCashAddress: null,
                    ethereumAddress: null,
                    usdtTrc20Address: null,
                    bnbAddress: null,
                  };
                  await sendWithdrawalApprovedEmail(
                    user,
                    tx.amount,
                    tx.description || "Your crypto wallet"
                  );
                }
              } catch (emailErr) {
                console.error(
                  "Withdrawal approval email failed (non-fatal):",
                  emailErr
                );
              }
              res.json({
                success: true,
                message: "Withdrawal approved",
                data: updated,
              });
            } catch (error) {
              console.error("Error approving withdrawal:", error);
              res.status(500).json({ error: "Internal server error" });
            }
          }
        );
      },
    },
    {
      method: "GET",
      path: "/transactions",
      registrar: (r) => {
        r.get("/transactions", async (req: Request, res: Response) => {
          try {
            const page = parseInt((req.query.page as string) || "1", 10) || 1;
            const limit = Math.min(
              100,
              parseInt((req.query.limit as string) || "20", 10) || 20
            );
            const offset = (page - 1) * limit;
            const search = (req.query.search as string) || undefined;
            const status = (req.query.status as string) || undefined;
            const type = (req.query.type as string) || undefined;
            const dateFrom = (req.query.dateFrom as string) || undefined;
            const dateTo = (req.query.dateTo as string) || undefined;
            const transactions = await storage.getTransactions({
              limit,
              offset,
              search,
              status,
              type,
              dateFrom,
              dateTo,
            });
            const total = await storage.getTransactionCount({
              search,
              status,
              type,
              dateFrom,
              dateTo,
            });
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
              success: true,
              data: transactions,
              pagination: { total, totalPages, currentPage: page, limit },
            });
          } catch (error) {
            console.error("Admin transactions fetch error:", error);
            res.status(500).json({
              success: false,
              message: "Failed to fetch transactions",
            });
          }
        });
      },
    },
    {
      method: "GET",
      path: "/deposits/pending",
      registrar: (r) => {
        r.get("/deposits/pending", async (req: Request, res: Response) => {
          try {
            const page = parseInt((req.query.page as string) || "1", 10) || 1;
            const limit = Math.min(
              100,
              parseInt((req.query.limit as string) || "20", 10) || 20
            );
            const offset = (page - 1) * limit;
            const data = await storage.getPendingDeposits({ limit, offset });
            const total = await storage.getPendingDepositCount();
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
              success: true,
              data,
              pagination: { total, totalPages, currentPage: page, limit },
            });
          } catch (error) {
            console.error("Admin pending deposits fetch error:", error);
            res.status(500).json({
              success: false,
              message: "Failed to fetch pending deposits",
            });
          }
        });
      },
    },
    {
      method: "GET",
      path: "/withdrawals/pending",
      registrar: (r) => {
        r.get("/withdrawals/pending", async (req: Request, res: Response) => {
          try {
            // Reuse generic transactions endpoint via filters
            const page = parseInt((req.query.page as string) || "1", 10) || 1;
            const limit = Math.min(
              100,
              parseInt((req.query.limit as string) || "20", 10) || 20
            );
            const offset = (page - 1) * limit;
            const transactions = await storage.getTransactions({
              limit,
              offset,
              status: "pending",
              type: "withdrawal",
            });
            const total = await storage.getTransactionCount({
              status: "pending",
              type: "withdrawal",
            });
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
              success: true,
              data: transactions,
              pagination: { total, totalPages, currentPage: page, limit },
            });
          } catch (error) {
            console.error("Admin pending withdrawals fetch error:", error);
            res.status(500).json({
              success: false,
              message: "Failed to fetch pending withdrawals",
            });
          }
        });
      },
    },
    {
      method: "GET",
      path: "/stats/summary",
      registrar: (r) => {
        r.get("/stats/summary", async (_req: Request, res: Response) => {
          try {
            const [
              userCount,
              pendingVerifications,
              pendingDeposits,
              pendingWithdrawals,
              totalDeposits,
              totalWithdrawals,
            ] = await Promise.all([
              storage.getUserCount(),
              storage.getPendingVerificationCount(),
              storage.getPendingDepositCount(),
              storage.getPendingWithdrawalCount(),
              storage.getTotalDepositAmount(),
              storage.getTotalWithdrawalAmount(),
            ]);
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
                  totalDeposits,
                  totalWithdrawals,
                  profit: totalDeposits - totalWithdrawals,
                },
              },
            });
          } catch (error) {
            console.error("Admin stats summary error:", error);
            res.status(500).json({
              success: false,
              message: "Failed to fetch stats summary",
            });
          }
        });
      },
    },
    {
      method: "GET",
      path: "/emails/health",
      registrar: (r) => {
        r.get("/emails/health", (_req: Request, res: Response) => {
          res.json({ success: true, emailConfigured: isEmailConfigured() });
        });
      },
    },
  ];

  for (const spec of routes) {
    const full = `/api/admin${spec.path}`;
    if (routeAlreadyRegistered(app, spec.method, full)) {
      console.log(`⏭️  Skipping duplicate admin route ${spec.method} ${full}`);
      continue;
    }
    spec.registrar(router);
  }

  return router;
}

export function setupAdminApi(app: express.Express) {
  const r = createAdminApiRouter(app);
  app.use("/api/admin", r);
  console.log("✅ Modular admin API mounted (health, users, deposit approval)");
}

export default setupAdminApi;
