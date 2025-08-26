import { User as DrizzleUser } from "@shared/schema";
import express, { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
// Note: We avoid importing requireAdminRole here to support token-only auth
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
  // Map Supabase bearer tokens to req.user (mirrors routes.ts behavior)
  router.use(async (req, _res, next) => {
    if (!req.user) {
      const authHeader =
        req.headers.authorization || (req.headers as any).Authorization;
      if (typeof authHeader === "string" && authHeader.startsWith("Bearer ")) {
        const token = authHeader.slice(7).trim();
        try {
          (req as any).bearerPresent = true;
          const secret = process.env.SUPABASE_JWT_SECRET;
          const allowUnverified =
            process.env.SUPABASE_UNVERIFIED_FALLBACK === "true" ||
            process.env.ADMIN_JWT_ALLOW_UNVERIFIED === "true";
          let decoded: any = null;
          if (secret) {
            try {
              decoded = jwt.verify(token, secret as any);
            } catch (e) {
              // If verification fails, do not trust claims; keep decoded null
              decoded = null;
              (req as any).bearerVerifyFailed = true;
            }
          }
          // As a last resort in development, allow unsigned decode to map uid -> user
          if (!decoded && allowUnverified) {
            decoded = jwt.decode(token);
            if (!decoded) (req as any).bearerDecodeError = true;
          }
          if (!decoded && !secret) {
            (req as any).bearerMappingFailed = true;
            (req as any).bearerMissingSecret = true;
          }
          const uid: string | undefined = decoded?.sub;
          let mappedUser: any = null;
          if (uid && typeof uid === "string" && uid.length >= 16) {
            mappedUser = await (storage as any).getUserByUid?.(uid);
            if (mappedUser) (req as any).bearerMappedBy = "uid";
          }
          if (!mappedUser) {
            const possibleId = decoded?.userId || decoded?.id;
            if (possibleId && !Number.isNaN(Number(possibleId))) {
              mappedUser = await storage.getUser(Number(possibleId));
              if (mappedUser) (req as any).bearerMappedBy = "numericId";
            }
          }
          if (!mappedUser && decoded?.email) {
            mappedUser = await (storage as any).getUserByEmail?.(decoded.email);
            if (mappedUser) (req as any).bearerMappedBy = "email";
          }
          if (mappedUser) (req as any).user = mappedUser;
          else {
            (req as any).bearerMappingFailed = true;
            if (process.env.NODE_ENV !== "production") {
              console.warn("[admin-api] bearer mapping failed", {
                hasSecret: !!process.env.SUPABASE_JWT_SECRET,
                allowUnverified,
                decodedSub: decoded?.sub,
                decodedEmail: decoded?.email,
              });
            }
          }
        } catch {
          // ignore
        }
      }
    }
    next();
  });
  // Lightweight admin guard that works with session or bearer-mapped users
  router.use((req, res, next) => {
    const user: any = (req as any).user;
    if (!user) {
      return res.status(401).json({
        message: "You must be logged in",
        bearer: (req as any).bearerPresent
          ? {
              present: true,
              mappedBy: (req as any).bearerMappedBy || null,
              mappingFailed: !!(req as any).bearerMappingFailed,
              decodeError: !!(req as any).bearerDecodeError,
              missingSecret: !!(req as any).bearerMissingSecret,
              verifyFailed: !!(req as any).bearerVerifyFailed,
            }
          : undefined,
      });
    }
    const ownerId = process.env.OWNER_USER_ID;
    const ownerEmail = process.env.OWNER_EMAIL;
    const ownerUid = process.env.OWNER_UID;
    const isOwner =
      (!!ownerId && String(user.id) === String(ownerId)) ||
      (!!ownerEmail &&
        user.email &&
        String(user.email).toLowerCase() ===
          String(ownerEmail).toLowerCase()) ||
      (!!ownerUid &&
        (user.uid || (user as any).auth_uid) &&
        String(user.uid || (user as any).auth_uid) === String(ownerUid));
    if (!(user.role === "admin" || user.is_admin === true || isOwner)) {
      return res.status(403).json({ message: "Admin access required" });
    }
    next();
  });

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
      method: "POST",
      path: "/admins/:id/promote",
      registrar: (r) => {
        // Only the designated OWNER can promote others to admin
        r.post("/admins/:id/promote", async (req: Request, res: Response) => {
          try {
            const actor: any = (req as any).user;
            const ownerIdEnv = process.env.OWNER_USER_ID;
            const ownerEmail = process.env.OWNER_EMAIL;
            const ownerUid = process.env.OWNER_UID;
            const isOwner =
              (!!ownerIdEnv && String(actor?.id) === String(ownerIdEnv)) ||
              (!!ownerEmail &&
                actor?.email &&
                String(actor.email).toLowerCase() ===
                  String(ownerEmail).toLowerCase()) ||
              (!!ownerUid &&
                (actor?.uid || (actor as any).auth_uid) &&
                String(actor.uid || (actor as any).auth_uid) ===
                  String(ownerUid));
            if (!isOwner) {
              return res.status(403).json({
                success: false,
                message: "Only owner can promote admins",
              });
            }
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id))
              return res
                .status(400)
                .json({ success: false, message: "Invalid ID" });
            const target = await storage.getUser(id);
            if (!target)
              return res
                .status(404)
                .json({ success: false, message: "User not found" });
            const updated = await storage.updateUser(id, {
              role: "admin",
              isActive: true,
            });
            if (!updated)
              return res
                .status(500)
                .json({ success: false, message: "Failed to promote user" });
            res.json({
              success: true,
              message: "User promoted to admin",
              data: { id: updated.id, role: "admin" },
            });
          } catch (error) {
            console.error("Promote admin error:", error);
            res
              .status(500)
              .json({ success: false, message: "Internal server error" });
          }
        });
      },
    },
    {
      method: "POST",
      path: "/admins/:id/demote",
      registrar: (r) => {
        // Only OWNER can demote other admins; cannot demote self
        r.post("/admins/:id/demote", async (req: Request, res: Response) => {
          try {
            const actor: any = (req as any).user;
            const ownerIdEnv = process.env.OWNER_USER_ID;
            const ownerEmail = process.env.OWNER_EMAIL;
            const ownerUid = process.env.OWNER_UID;
            const isOwner =
              (!!ownerIdEnv && String(actor?.id) === String(ownerIdEnv)) ||
              (!!ownerEmail &&
                actor?.email &&
                String(actor.email).toLowerCase() ===
                  String(ownerEmail).toLowerCase()) ||
              (!!ownerUid &&
                (actor?.uid || (actor as any).auth_uid) &&
                String(actor.uid || (actor as any).auth_uid) ===
                  String(ownerUid));
            if (!isOwner) {
              return res.status(403).json({
                success: false,
                message: "Only owner can demote admins",
              });
            }
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id))
              return res
                .status(400)
                .json({ success: false, message: "Invalid ID" });
            if (!!ownerIdEnv && String(id) === String(ownerIdEnv))
              return res
                .status(400)
                .json({ success: false, message: "Owner cannot be demoted" });
            const target = await storage.getUser(id);
            if (!target)
              return res
                .status(404)
                .json({ success: false, message: "User not found" });
            const updated = await storage.updateUser(id, {
              role: "user",
              isActive: true,
            });
            if (!updated)
              return res
                .status(500)
                .json({ success: false, message: "Failed to demote user" });
            res.json({
              success: true,
              message: "Admin demoted to user",
              data: { id: updated.id, role: "user" },
            });
          } catch (error) {
            console.error("Demote admin error:", error);
            res
              .status(500)
              .json({ success: false, message: "Internal server error" });
          }
        });
      },
    },
    {
      method: "POST",
      path: "/admins/:id/password",
      registrar: (r) => {
        // OWNER can set or reset an admin's password; admins can change their own
        r.post("/admins/:id/password", async (req: Request, res: Response) => {
          try {
            const actor: any = (req as any).user;
            const id = parseInt(req.params.id, 10);
            const newPassword = (req.body?.password as string) || "";
            if (!newPassword || newPassword.length < 6)
              return res
                .status(400)
                .json({ success: false, message: "Password too short" });
            if (Number.isNaN(id))
              return res
                .status(400)
                .json({ success: false, message: "Invalid ID" });
            const ownerIdEnv = process.env.OWNER_USER_ID;
            const ownerEmail = process.env.OWNER_EMAIL;
            const ownerUid = process.env.OWNER_UID;
            const isOwner =
              (!!ownerIdEnv && String(actor?.id) === String(ownerIdEnv)) ||
              (!!ownerEmail &&
                actor?.email &&
                String(actor.email).toLowerCase() ===
                  String(ownerEmail).toLowerCase()) ||
              (!!ownerUid &&
                (actor?.uid || (actor as any).auth_uid) &&
                String(actor.uid || (actor as any).auth_uid) ===
                  String(ownerUid));
            const isSelf = actor && actor.id === id;
            if (!isOwner && !isSelf)
              return res.status(403).json({
                success: false,
                message: "Not authorized to change this password",
              });
            const target = await storage.getUser(id);
            if (!target)
              return res
                .status(404)
                .json({ success: false, message: "User not found" });
            if (!isOwner && target.role !== "admin")
              return res.status(403).json({
                success: false,
                message: "Only admins can change their own password here",
              });
            const updated = await storage.updateUser(id, {
              password: newPassword,
            });
            if (!updated)
              return res
                .status(500)
                .json({ success: false, message: "Failed to update password" });
            res.json({ success: true, message: "Password updated" });
          } catch (error) {
            console.error("Set admin password error:", error);
            res
              .status(500)
              .json({ success: false, message: "Internal server error" });
          }
        });
      },
    },
    {
      method: "DELETE",
      path: "/users/:id",
      registrar: (r) => {
        r.delete("/users/:id", async (req: Request, res: Response) => {
          try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id))
              return res
                .status(400)
                .json({ success: false, message: "Invalid ID" });
            const ok = await storage.deleteUser(id);
            if (!ok)
              return res
                .status(400)
                .json({ success: false, message: "Unable to delete user" });
            res.json({ success: true, message: "User removed" });
          } catch (error) {
            console.error("Admin delete user error:", error);
            res
              .status(500)
              .json({ success: false, message: "Failed to delete user" });
          }
        });
      },
    },
    {
      method: "GET",
      path: "/transactions/:id",
      registrar: (r) => {
        r.get("/transactions/:id", async (req: Request, res: Response) => {
          try {
            const id = parseInt(req.params.id, 10);
            if (Number.isNaN(id))
              return res
                .status(400)
                .json({ success: false, message: "Invalid ID" });
            const tx = await storage.getTransaction(id);
            if (!tx)
              return res
                .status(404)
                .json({ success: false, message: "Not found" });
            res.json({ success: true, data: tx });
          } catch (error) {
            console.error("Admin get transaction error:", error);
            res
              .status(500)
              .json({ success: false, message: "Failed to fetch transaction" });
          }
        });
      },
    },
    {
      method: "POST",
      path: "/deposits/:id/reject",
      registrar: (r) => {
        r.post("/deposits/:id/reject", async (req: Request, res: Response) => {
          try {
            const id = parseInt(req.params.id, 10);
            const reason = (req.body?.reason as string) || null;
            if (Number.isNaN(id))
              return res
                .status(400)
                .json({ success: false, message: "Invalid ID" });
            const tx = await storage.getTransaction(id);
            if (!tx)
              return res
                .status(404)
                .json({ success: false, message: "Transaction not found" });
            if (tx.type !== "deposit")
              return res
                .status(400)
                .json({ success: false, message: "Not a deposit" });
            const updated = await storage.updateTransactionStatus(
              id,
              "rejected",
              reason || undefined
            );
            res.json({
              success: true,
              message: "Deposit rejected",
              data: updated,
            });
          } catch (error) {
            console.error("Error rejecting deposit:", error);
            res
              .status(500)
              .json({ success: false, message: "Internal server error" });
          }
        });
      },
    },
    {
      method: "POST",
      path: "/withdrawals/:id/reject",
      registrar: (r) => {
        r.post(
          "/withdrawals/:id/reject",
          async (req: Request, res: Response) => {
            try {
              const id = parseInt(req.params.id, 10);
              const reason = (req.body?.reason as string) || null;
              if (Number.isNaN(id))
                return res
                  .status(400)
                  .json({ success: false, message: "Invalid ID" });
              const tx = await storage.getTransaction(id);
              if (!tx)
                return res
                  .status(404)
                  .json({ success: false, message: "Transaction not found" });
              if (tx.type !== "withdrawal")
                return res
                  .status(400)
                  .json({ success: false, message: "Not a withdrawal" });
              const updated = await storage.updateTransactionStatus(
                id,
                "rejected",
                reason || undefined
              );
              // Refund the held balance since withdrawal was rejected
              let balanceRefunded = false;
              let newBalance: number | undefined = undefined;
              try {
                const amountNum = Number((tx as any).amount || 0);
                if (Number.isFinite(amountNum) && amountNum !== 0) {
                  // Resolve user by uid or numeric id
                  let userForBalance: any = null;
                  const possibleUid =
                    (tx as any).userUid ||
                    (tx as any).user_uid ||
                    (tx as any).userId;
                  if (
                    possibleUid &&
                    typeof possibleUid === "string" &&
                    possibleUid.length >= 16 &&
                    (storage as any).getUserByUid
                  ) {
                    userForBalance = await (storage as any).getUserByUid(
                      possibleUid
                    );
                  }
                  if (!userForBalance) {
                    const numericId = Number(
                      (tx as any).userId || (tx as any).user_id
                    );
                    if (!Number.isNaN(numericId))
                      userForBalance = await storage.getUser(numericId);
                  }
                  if (userForBalance) {
                    const refunded = await storage.adjustUserBalance(
                      userForBalance.id,
                      amountNum
                    );
                    balanceRefunded = !!refunded;
                    if (balanceRefunded) {
                      const fresh = await storage.getUser(userForBalance.id);
                      const bal = Number((fresh as any)?.balance || 0);
                      if (Number.isFinite(bal)) newBalance = bal;
                    }
                  }
                }
              } catch (balErr) {
                console.error(
                  "Balance refund on withdrawal rejection failed:",
                  balErr
                );
              }
              res.json({
                success: true,
                message: "Withdrawal rejected",
                data: { ...updated, newBalance },
                balanceRefunded,
              });
            } catch (error) {
              console.error("Error rejecting withdrawal:", error);
              res
                .status(500)
                .json({ success: false, message: "Internal server error" });
            }
          }
        );
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
            const status = (req.query.status as string) || undefined;

            const [users, total] = await Promise.all([
              storage.getUsers({ limit, offset, search, status }),
              storage.getUserCount({ search, status }),
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
            const status = (req.query.status as string) || undefined;
            const [users, total] = await Promise.all([
              storage.getUsers({ limit, offset, search, status }),
              storage.getUserCount({ search, status }),
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
            // Credit user's available balance by the deposit amount
            let balanceCredited = false;
            let normalizedUserId: number | undefined = undefined;
            try {
              const amountNum = Number((tx as any).amount || 0);
              if (Number.isFinite(amountNum) && amountNum !== 0) {
                // Resolve the user record robustly: transactions.user_id may store
                // the auth UID (uuid string) or a legacy numeric id. Prefer uid lookup
                // when the tx.userId/user_uid looks like a UUID, otherwise use numeric id.
                let resolvedUser: any = null;
                try {
                  const maybeUid =
                    (tx as any).userUid ||
                    (tx as any).user_uid ||
                    (tx as any).user_id ||
                    (tx as any).userId;
                  if (typeof maybeUid === "string" && maybeUid.length > 16) {
                    // likely a uuid
                    resolvedUser = await (storage as any).getUserByUid?.(
                      maybeUid
                    );
                  }
                } catch (uidErr) {
                  console.warn("User lookup by uid threw:", uidErr);
                }
                if (!resolvedUser) {
                  // Try numeric id fallback
                  try {
                    const numericId = Number(
                      (tx as any).userId || (tx as any).user_id
                    );
                    if (!Number.isNaN(numericId)) {
                      resolvedUser = await storage.getUser(numericId);
                    }
                  } catch (numErr) {
                    console.warn("User lookup by numeric id threw:", numErr);
                  }
                }
                if (resolvedUser && typeof resolvedUser.id === "number") {
                  normalizedUserId = resolvedUser.id;
                  const updatedUser = await storage.adjustUserBalance(
                    resolvedUser.id,
                    amountNum
                  );
                  balanceCredited = !!updatedUser;
                  console.log(
                    "[admin] credited balance for user",
                    resolvedUser.id,
                    "amount",
                    amountNum,
                    "result",
                    balanceCredited
                  );
                  if (balanceCredited) {
                    // Try to create a notification (non-fatal)
                    try {
                      await storage.createNotification({
                        userId: resolvedUser.id,
                        type: "transaction",
                        title: "Deposit Approved",
                        message: `Your deposit of $${amountNum} has been approved and credited to your account.`,
                        relatedEntityType: "transaction",
                        relatedEntityId: id,
                        priority: "high",
                        expiresAt: new Date(
                          Date.now() + 1000 * 60 * 60 * 24 * 7
                        ),
                      });
                    } catch (notifErr) {
                      console.warn(
                        "Failed to create notification for user",
                        notifErr
                      );
                    }
                    // Refresh user's balance to include in response
                    try {
                      const refreshed = await storage.getUser(resolvedUser.id);
                      if (
                        refreshed &&
                        (refreshed as any).balance !== undefined
                      ) {
                        (updated as any).newBalance = (
                          refreshed as any
                        ).balance;
                      }
                    } catch (refErr) {
                      console.warn(
                        "Failed to fetch refreshed user after balance update",
                        refErr
                      );
                    }
                  }
                } else {
                  console.warn(
                    "[admin] could not resolve user for tx.userId=",
                    tx.userId,
                    "- skipping balance credit"
                  );
                }
              }
            } catch (balErr) {
              console.error(
                "Balance credit on deposit approval failed:",
                balErr
              );
            }
            let emailSent: boolean | undefined = undefined;
            try {
              // Attempt to resolve the same user record for email sending as well
              let userRaw: any = null;
              try {
                const maybeUid = (tx as any).userId;
                if (typeof maybeUid === "string" && maybeUid.length > 16) {
                  userRaw = await (storage as any).getUserByUid?.(maybeUid);
                }
              } catch (uidErr) {
                console.warn("User lookup by uid threw:", uidErr);
              }
              if (!userRaw) {
                const numericId = Number((tx as any).userId);
                if (!Number.isNaN(numericId)) {
                  userRaw = await storage.getUser(numericId);
                }
              }
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
                // Derive method/plan for email template
                const methodForEmail =
                  (tx as any).cryptoType || (tx as any).method || "Investment";
                const planForEmail =
                  (tx as any).planName || (tx as any).plan_name;
                // Try primary email sender
                emailSent = await sendDepositApprovedEmail(
                  user,
                  tx.amount,
                  methodForEmail,
                  planForEmail
                );
                // Fallback to emailManager if primary failed
                if (!emailSent) {
                  try {
                    const { sendDepositApprovedEmail: mgrSend } = await import(
                      "./emailManager"
                    );
                    emailSent = await mgrSend(
                      user,
                      tx.amount,
                      methodForEmail,
                      planForEmail
                    );
                  } catch (mgrErr) {
                    console.warn(
                      "Deposit approval email fallback failed",
                      mgrErr
                    );
                  }
                }
              }
            } catch (emailErr) {
              console.error(
                "Deposit approval email failed (non-fatal):",
                emailErr
              );
              emailSent = false;
            }
            res.json({
              success: true,
              message: "Deposit approved",
              data: {
                ...updated,
                userId:
                  normalizedUserId ??
                  (updated as any)?.userId ??
                  (updated as any)?.user_id,
              },
              emailSent,
              balanceCredited,
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
              // Get current balance (funds were already held when withdrawal was requested)
              let newBalance: number | undefined = undefined;
              try {
                // Resolve user by uid or numeric id to get current balance
                let userForBalance: any = null;
                const possibleUid =
                  (tx as any).userUid ||
                  (tx as any).user_uid ||
                  (tx as any).userId;
                if (
                  possibleUid &&
                  typeof possibleUid === "string" &&
                  possibleUid.length >= 16 &&
                  (storage as any).getUserByUid
                ) {
                  userForBalance = await (storage as any).getUserByUid(
                    possibleUid
                  );
                }
                if (!userForBalance) {
                  const numericId = Number(
                    (tx as any).userId || (tx as any).user_id
                  );
                  if (!Number.isNaN(numericId))
                    userForBalance = await storage.getUser(numericId);
                }
                if (userForBalance) {
                  const bal = Number((userForBalance as any).balance || 0);
                  if (Number.isFinite(bal)) newBalance = bal;
                }
              } catch (balErr) {
                console.error(
                  "Failed to fetch current balance on withdrawal approval:",
                  balErr
                );
              }
              let emailSent: boolean | undefined = undefined;
              try {
                // Re-fetch user similarly after debit to email the correct recipient
                const numericUserId = Number(
                  (tx as any).userId || (tx as any).user_id
                );
                const userRaw = !Number.isNaN(numericUserId)
                  ? await storage.getUser(numericUserId)
                  : (await (storage as any).getUserByUid?.(
                      (tx as any).userUid || (tx as any).user_uid
                    )) || null;
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
                  emailSent = await sendWithdrawalApprovedEmail(
                    user,
                    tx.amount,
                    tx.description || "Your crypto wallet"
                  );
                  if (!emailSent) {
                    try {
                      const { sendWithdrawalApprovedEmail: mgrSend } =
                        await import("./emailManager");
                      emailSent = await mgrSend(
                        user,
                        tx.amount,
                        tx.description || "Your crypto wallet"
                      );
                    } catch (mgrErr) {
                      console.warn(
                        "Withdrawal approval email fallback failed",
                        mgrErr
                      );
                    }
                  }
                }
              } catch (emailErr) {
                console.error(
                  "Withdrawal approval email failed (non-fatal):",
                  emailErr
                );
                emailSent = false;
              }
              res.json({
                success: true,
                message: "Withdrawal approved",
                data: { ...updated, newBalance },
                emailSent,
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
      method: "DELETE",
      path: "/deposits/:id",
      registrar: (r) => {
        r.delete("/deposits/:id", async (req: Request, res: Response) => {
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
            const status = (tx.status || "").toLowerCase();
            if (status !== "completed" && status !== "approved") {
              return res.status(409).json({
                error:
                  "Only completed/approved deposits can be deleted by admin",
              });
            }
            const ok = await storage.deleteTransaction(id);
            if (!ok)
              return res
                .status(500)
                .json({ error: "Failed to delete transaction" });
            res.json({ success: true });
          } catch (error) {
            console.error("Error deleting deposit:", error);
            res.status(500).json({ error: "Internal server error" });
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
      path: "/stats/timeseries",
      registrar: (r) => {
        r.get("/stats/timeseries", async (req: Request, res: Response) => {
          try {
            const type =
              (req.query.type as string) === "withdrawal"
                ? "withdrawal"
                : "deposit";
            const interval = req.query.interval as string as any;
            const days = req.query.days
              ? parseInt(req.query.days as string, 10)
              : undefined;
            const series = await storage.getTimeSeriesSums({
              type: type as any,
              days,
              interval:
                interval === "weekly" || interval === "monthly"
                  ? interval
                  : "daily",
            });
            res.json({
              success: true,
              data: { type, interval: interval || "daily", series },
            });
          } catch (error) {
            console.error("Admin stats timeseries error:", error);
            res
              .status(500)
              .json({ success: false, message: "Failed to fetch time series" });
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
