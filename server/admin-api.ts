import { User as DrizzleUser } from "@shared/schema";
import express, { Request, Response, Router } from "express";
import jwt from "jsonwebtoken";
// Daily investment shared job logic (adds job_runs row, metrics, logging)
import { runDailyInvestmentJob } from "../shared/dailyInvestmentJob.shared";
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
//  DELETE /api/admin/deposits/:id
//  DELETE /api/admin/withdrawals/:id
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
  // Temporary emergency bypass: header x-admin-job-key matching ADMIN_JOB_KEY env injects synthetic admin.
  // NOTE: Remove once session auth to this router is confirmed working.
  router.use((req, _res, next) => {
    if (!req.user) {
      const hdr = req.headers["x-admin-job-key"] as string | undefined;
      const expected = process.env.ADMIN_JOB_KEY;
      if (expected && hdr && hdr === expected) {
        (req as any).user = {
          id: 0,
          role: "admin",
          email: "synthetic-admin@local",
        };
        (req as any).syntheticAdmin = true;
      }
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
    // Daily investment job status endpoint (was previously only in legacy router)
    {
      method: "GET",
      path: "/jobs/daily-investments/status",
      registrar: (r) => {
        r.get(
          "/jobs/daily-investments/status",
          async (_req: Request, res: Response) => {
            try {
              const supabase = (await import("./supabase")).supabase as any;
              const { data: rows, error } = await supabase
                .from("job_runs")
                .select("*")
                // NOTE: job_name inserted by runDailyInvestmentJob uses hyphen form "daily-investments"
                .eq("job_name", "daily-investments")
                .order("started_at", { ascending: false })
                .limit(1);
              if (error) {
                console.error("[admin-api] job status query error", error);
                return res
                  .status(500)
                  .json({ ok: false, error: "query_failed" });
              }
              const last = rows && rows.length ? rows[0] : null;
              const now = new Date();
              const nowUtcDate = new Date(
                Date.UTC(
                  now.getUTCFullYear(),
                  now.getUTCMonth(),
                  now.getUTCDate()
                )
              );
              let stale = true;
              let cooldownMs: number = 0;
              let nextRunUtc: string | null = null;
              if (last) {
                try {
                  const started = new Date(
                    last.started_at || last.startedAt || last.created_at
                  );
                  const ageMs = Date.now() - started.getTime();
                  // stale if older than 26h or run_date not today UTC
                  const runDateStr = last.run_date || last.runDate;
                  let sameUtcDay = false;
                  if (runDateStr) {
                    const rd = new Date(runDateStr);
                    sameUtcDay =
                      rd.getUTCFullYear() === now.getUTCFullYear() &&
                      rd.getUTCMonth() === now.getUTCMonth() &&
                      rd.getUTCDate() === now.getUTCDate();
                  } else if (!Number.isNaN(started.getTime())) {
                    sameUtcDay =
                      started.getUTCFullYear() === now.getUTCFullYear() &&
                      started.getUTCMonth() === now.getUTCMonth() &&
                      started.getUTCDate() === now.getUTCDate();
                  }
                  stale = !(
                    ageMs < 26 * 60 * 60 * 1000 &&
                    sameUtcDay &&
                    last.success !== false
                  );
                  if (
                    !stale &&
                    !last?.meta?.dryRun &&
                    last.success !== false &&
                    sameUtcDay
                  ) {
                    const nextMidnight = new Date(
                      Date.UTC(
                        now.getUTCFullYear(),
                        now.getUTCMonth(),
                        now.getUTCDate() + 1,
                        0,
                        0,
                        0,
                        0
                      )
                    );
                    const remaining = nextMidnight.getTime() - now.getTime();
                    if (remaining > 0) cooldownMs = remaining;
                    else cooldownMs = 0;
                    nextRunUtc = nextMidnight.toISOString();
                  }
                } catch (e) {
                  // keep stale true on parse failure
                }
              }
              return res.json({
                ok: true,
                last,
                stale,
                cooldownMs,
                nextRunUtc,
                now: new Date().toISOString(),
              });
            } catch (e: any) {
              console.error("[admin-api] job status error", e);
              return res
                .status(500)
                .json({ ok: false, error: e?.message || "error" });
            }
          }
        );
      },
    },
    // List recent daily investment job runs
    {
      method: "GET",
      path: "/jobs/daily-investments/runs",
      registrar: (r) => {
        r.get(
          "/jobs/daily-investments/runs",
          async (req: Request, res: Response) => {
            try {
              const page = Math.max(
                1,
                parseInt((req.query.page as string) || "1", 10) || 1
              );
              const limit = Math.min(
                100,
                parseInt((req.query.limit as string) || "20", 10) || 20
              );
              const offset = (page - 1) * limit;
              const supabase = (await import("./supabase")).supabase as any;
              const { data: rows, error } = await supabase
                .from("job_runs")
                .select("*", { count: "exact" })
                // Align job_name filter with insertion key (hyphenated)
                .eq("job_name", "daily-investments")
                .order("started_at", { ascending: false })
                .range(offset, offset + limit - 1);
              if (error) {
                console.error("[admin-api] job runs query error", error);
                return res
                  .status(500)
                  .json({ ok: false, error: "query_failed" });
              }
              // second query for total count if not provided (fallback)
              let total = (rows as any)?.length || 0;
              try {
                const { count } = await supabase
                  .from("job_runs")
                  .select("id", { count: "exact", head: true })
                  // Ensure deletion / maintenance queries use consistent hyphenated job_name
                  .eq("job_name", "daily-investments");
                if (typeof count === "number") total = count;
              } catch {}
              return res.json({
                ok: true,
                data: rows || [],
                pagination: {
                  page,
                  limit,
                  total,
                  totalPages: Math.ceil(total / limit) || 1,
                },
              });
            } catch (e: any) {
              console.error("[admin-api] job runs error", e);
              return res
                .status(500)
                .json({ ok: false, error: e?.message || "error" });
            }
          }
        );
      },
    },
    // Trigger daily investments job (supports dryRun=1). This was originally in admin-routes
    // but that router is not mounted in the current server bootstrap; adding here ensures
    // both session and bearer (Supabase) admin contexts can invoke it.
    {
      method: "POST",
      path: "/investments/run-daily",
      registrar: (r) => {
        r.post(
          "/investments/run-daily",
          async (req: Request, res: Response) => {
            const dryRun =
              req.query.dryRun === "1" || req.query.dryRun === "true";
            try {
              const started = Date.now();
              const metrics = await runDailyInvestmentJob({
                supabaseUrl: process.env.SUPABASE_URL!,
                serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY!,
                dryRun,
                source: "api",
                sendIncrementEmails:
                  process.env.DAILY_JOB_INCREMENT_EMAILS === "true",
                sendCompletionEmails:
                  process.env.DAILY_JOB_COMPLETION_EMAILS !== "false",
                forceCreditOnCompletionOnly:
                  process.env.DAILY_JOB_FORCE_COMPLETION_ONLY === "true",
              });
              const elapsedMs = Date.now() - started;
              return res
                .status(200)
                .json({ ok: true, dryRun, elapsedMs, metrics });
            } catch (e: any) {
              console.error("[admin-api] run-daily failed", e);
              return res
                .status(500)
                .json({ ok: false, error: e?.message || "failed" });
            }
          }
        );
      },
    },
    {
      method: "POST",
      path: "/reconcile/post-cutoff-earnings",
      registrar: (r) => {
        r.post(
          "/reconcile/post-cutoff-earnings",
          async (req: Request, res: Response) => {
            try {
              const { userId, dryRun } = req.body || {};
              const supabase = (await import("./supabase")).supabase as any;
              const CREDIT_POLICY_CUTOFF_ISO = "2025-09-18T00:00:00Z";
              const cutoffMs = new Date(CREDIT_POLICY_CUTOFF_ISO).getTime();

              // Get users list to iterate or a single user
              let users: any[] = [];
              if (userId) {
                const { data, error } = await supabase
                  .from("users")
                  .select("id, balance")
                  .eq("id", Number(userId))
                  .limit(1);
                if (error) throw error;
                users = data || [];
              } else {
                const { data, error } = await supabase
                  .from("users")
                  .select("id, balance")
                  .order("id", { ascending: true });
                if (error) throw error;
                users = data || [];
              }

              const results: any[] = [];
              let totalAdjusted = 0;
              for (const u of users) {
                const uid = Number(u.id);
                // Sum accrued earnings for active investments starting on/after cutoff
                const { data: invs, error: invErr } = await supabase
                  .from("investments")
                  .select("start_date, total_earned, status")
                  .eq("user_id", uid)
                  .eq("status", "active");
                if (invErr) throw invErr;
                const overCredited = (invs || []).reduce(
                  (acc: number, inv: any) => {
                    const sd = new Date(inv.start_date || 0).getTime();
                    if (!Number.isFinite(sd)) return acc;
                    if (sd >= cutoffMs)
                      return acc + Number(inv.total_earned || 0);
                    return acc;
                  },
                  0
                );
                const currentBal = Number(u.balance || 0);
                const adjustedAvailable = Math.max(
                  0,
                  currentBal - Number(overCredited || 0)
                );
                const delta = adjustedAvailable - currentBal; // negative if we need to subtract
                results.push({
                  userId: uid,
                  currentBal,
                  overCredited,
                  adjustedAvailable,
                  delta,
                });
                if (!dryRun && delta !== 0) {
                  const { data: updated, error: updErr } = await supabase
                    .from("users")
                    .update({
                      balance: String(adjustedAvailable),
                      updated_at: new Date().toISOString(),
                    })
                    .eq("id", uid)
                    .select("id, balance")
                    .single();
                  if (updErr) throw updErr;
                  // Best-effort audit log
                  try {
                    await supabase.from("audit_logs").insert({
                      userId: uid,
                      action: "reconcile_post_cutoff",
                      description: `Reconciled over-credited post-cutoff earnings: -$${Number(overCredited || 0).toFixed(2)}`,
                      details: JSON.stringify({
                        currentBal,
                        overCredited,
                        newBalance: adjustedAvailable,
                      }),
                    });
                  } catch (logErr) {
                    console.warn("audit log insert failed", logErr);
                  }
                }
                totalAdjusted += -delta; // amount removed from balances
              }

              return res.json({
                dryRun: !!dryRun,
                usersProcessed: users.length,
                totalAdjusted,
                results,
              });
            } catch (e: any) {
              console.error("Admin reconcile error:", e);
              return res.status(500).json({
                error: "Failed to reconcile",
                details: e?.message || String(e),
              });
            }
          }
        );
      },
    },
    {
      method: "GET",
      path: "/returns/today",
      registrar: (r) => {
        r.get("/returns/today", async (_req: Request, res: Response) => {
          try {
            const now = new Date();
            const todayUtc = new Date(
              Date.UTC(
                now.getUTCFullYear(),
                now.getUTCMonth(),
                now.getUTCDate()
              )
            ).toISOString();

            const supabase = (await import("./supabase")).supabase as any;

            const [{ data: rows, error: rErr }, { data: comps, error: cErr }] =
              await Promise.all([
                supabase
                  .from("investment_returns")
                  .select("amount")
                  .gte("return_date", todayUtc),
                supabase
                  .from("completed_investments")
                  .select("id")
                  .gte("completed_at", todayUtc),
              ]);

            if (rErr) {
              console.error("[admin] returns/today query error", rErr);
              return res
                .status(500)
                .json({ message: "Failed to load today's returns" });
            }
            if (cErr) {
              console.error(
                "[admin] returns/today completions query error",
                cErr
              );
              return res
                .status(500)
                .json({ message: "Failed to load today's completions" });
            }

            const count = (rows || []).length;
            const sum = (rows || []).reduce(
              (acc: number, r: any) => acc + Number(r.amount || 0),
              0
            );
            const completionsCount = (comps || []).length;

            return res.json({ todayUtc, count, sum, completionsCount });
          } catch (e: any) {
            console.error("[admin] /returns/today error", e);
            return res.status(500).json({
              message: "Failed to load today's summary",
              error: e?.message || String(e),
            });
          }
        });
      },
    },
    {
      method: "GET",
      path: "/audit-logs",
      registrar: (r) => {
        r.get("/audit-logs", async (req: Request, res: Response) => {
          try {
            const page = Math.max(
              1,
              parseInt((req.query.page as string) || "1", 10) || 1
            );
            const limit = Math.min(
              100,
              parseInt((req.query.limit as string) || "20", 10) || 20
            );
            const offset = (page - 1) * limit;
            const action = (req.query.action as string) || undefined;
            const search = (req.query.search as string) || undefined;

            // Fetch logs and total count
            const [logs, total] = await Promise.all([
              storage.getAuditLogs({ action, search, limit, offset }),
              storage.getAuditLogCount({ action, search }),
            ]);

            return res.status(200).json({
              data: logs || [],
              pagination: {
                page,
                limit,
                total: total || 0,
                totalPages: Math.ceil((total || 0) / limit),
              },
            });
          } catch (e: any) {
            console.error("Admin audit-logs error:", e);
            return res.status(500).json({
              error: "Failed to fetch audit logs",
              details: e?.message || String(e),
            });
          }
        });
      },
    },
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
            // Credit user's available balance or lock into activeDeposits if investment
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
                  let updatedUser;
                  // Always credit external deposits to available balance
                  // Only internal transfers (reinvest) should move to activeDeposits
                  updatedUser = await storage.adjustUserBalance(
                    resolvedUser.id,
                    amountNum
                  );
                  balanceCredited = !!updatedUser;
                  console.log(
                    "[admin] deposit approval credited to available balance for user",
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
                        message: `Your deposit of $${amountNum} has been approved and added to your available balance. You can now use these funds or invest them through the reinvest option.`,
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
            let emailOutcome: string | undefined = undefined;
            try {
              console.log("[email-debug] deposit approval route hit", {
                txId: id,
              });
              // Attempt to resolve the user
              let userRaw: any = null;
              try {
                const maybeUid =
                  (tx as any).userUid ||
                  (tx as any).user_uid ||
                  (tx as any).userId ||
                  (tx as any).user_id;
                console.log(
                  "🔍 [USER LOOKUP DEBUG] Deposit approval user lookup",
                  {
                    txId: id,
                    txUserId: (tx as any).userId,
                    txUser_id: (tx as any).user_id,
                    txUserUid: (tx as any).userUid || (tx as any).user_uid,
                    maybeUid,
                    maybeUidType: typeof maybeUid,
                    maybeUidLength:
                      typeof maybeUid === "string" ? maybeUid.length : "N/A",
                    hasGetUserByUid: (storage as any).getUserByUid
                      ? "YES"
                      : "NO",
                  }
                );
                if (
                  typeof maybeUid === "string" &&
                  maybeUid.length > 16 &&
                  (storage as any).getUserByUid
                ) {
                  userRaw = await (storage as any).getUserByUid(maybeUid);
                }
              } catch (uidErr) {
                console.warn(
                  "[email-debug] deposit approval uid lookup threw",
                  uidErr
                );
              }
              if (!userRaw) {
                const numericId = Number(
                  (tx as any).userId || (tx as any).user_id
                );
                console.log(
                  "🔍 [USER LOOKUP DEBUG] Deposit approval fallback to numeric ID",
                  {
                    txId: id,
                    numericId,
                    isNaN: Number.isNaN(numericId),
                  }
                );
                if (!Number.isNaN(numericId)) {
                  userRaw = await storage.getUser(numericId);
                }
              }
              console.log("🔍 [USER LOOKUP RESULT] Deposit approval", {
                txId: id,
                userRaw: userRaw ? "FOUND" : "NULL",
                userRawId: userRaw?.id,
                userRawEmail: userRaw?.email,
              });
              if (!userRaw) {
                emailOutcome = "user-lookup-failed";
                emailSent = false;
              } else {
                const user: DrizzleUser = {
                  id: userRaw.id,
                  uid: (userRaw as any).uid || "",
                  email: userRaw.email,
                  username: (userRaw as any).username || null,
                  password: null,
                  firstName: null,
                  lastName: null,
                  full_name: null,
                  balance: null,
                  activeDeposits: "0",
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
                const methodForEmail =
                  (tx as any).cryptoType || (tx as any).method || "Investment";
                const planForEmail =
                  (tx as any).planName || (tx as any).plan_name;
                try {
                  const primaryOk = await sendDepositApprovedEmail(
                    user,
                    tx.amount,
                    methodForEmail,
                    planForEmail
                  );
                  emailSent = primaryOk;
                  emailOutcome = primaryOk
                    ? "primary-success"
                    : "primary-failed";
                  if (!primaryOk) {
                    try {
                      const { sendDepositApprovedEmail: mgrSend } =
                        await import("./emailManager");
                      const fallbackOk = await mgrSend(
                        user,
                        tx.amount,
                        methodForEmail,
                        planForEmail
                      );
                      emailSent = fallbackOk;
                      emailOutcome = fallbackOk
                        ? "fallback-success"
                        : "fallback-failed";
                    } catch (mgrErr) {
                      console.warn(
                        "[email-debug] deposit approval fallback threw",
                        mgrErr
                      );
                      emailOutcome = "fallback-exception";
                    }
                  }
                } catch (primaryErr) {
                  console.warn(
                    "[email-debug] deposit approval primary threw",
                    primaryErr
                  );
                  emailOutcome = "primary-exception";
                  emailSent = false;
                }
              }
            } catch (emailErr) {
              console.error("Deposit approval email block exception", emailErr);
              emailSent = false;
              if (!emailOutcome) emailOutcome = "exception";
            }

            // Create investment record if this deposit has investment plan data
            let investmentCreated = false;
            let firstProfitScheduled = false;
            try {
              if (
                normalizedUserId &&
                ((tx as any).plan_name || (tx as any).planName) &&
                ((tx as any).daily_profit || (tx as any).dailyProfit)
              ) {
                const { createInvestmentFromTransaction } = await import(
                  "./investmentService"
                );
                const result = await createInvestmentFromTransaction(id);
                if (result && result.success && result.investment) {
                  investmentCreated = true;
                  console.log(
                    `[admin] Created investment ${result.investment.id} for deposit ${id}`
                  );

                  // Schedule first profit for 24 hours from now
                  try {
                    const { scheduleFirstProfit } = await import(
                      "./investmentService"
                    );
                    const scheduled = await scheduleFirstProfit(
                      result.investment.id
                    );
                    if (scheduled) {
                      firstProfitScheduled = true;
                      console.log(
                        `[admin] Scheduled first profit for investment ${investment.id} in 24 hours`
                      );
                    }
                  } catch (scheduleErr) {
                    console.error(
                      "Failed to schedule first profit:",
                      scheduleErr
                    );
                    // Don't fail the deposit approval if scheduling fails
                  }
                }
              }
            } catch (investmentErr) {
              console.error(
                "Failed to create investment from deposit:",
                investmentErr
              );
              // Don't fail the deposit approval if investment creation fails
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
              emailOutcome,
              balanceCredited,
              investmentCreated,
              firstProfitScheduled,
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
                return res.json({
                  success: true,
                  message: "Already approved",
                  emailSent: false,
                  emailReason: "already_completed",
                });
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
              let emailReason: string | undefined = undefined;
              let emailOutcome: string | undefined = undefined;
              try {
                // Re-fetch user similarly after debit to email the correct recipient
                const numericUserId = Number(
                  (tx as any).userId || (tx as any).user_id
                );
                console.log(
                  "🔍 [USER LOOKUP DEBUG] Withdrawal approval user lookup",
                  {
                    txId: id,
                    txUserId: (tx as any).userId,
                    txUser_id: (tx as any).user_id,
                    txUserUid: (tx as any).userUid || (tx as any).user_uid,
                    numericUserId,
                    isNaN: Number.isNaN(numericUserId),
                  }
                );
                const userRaw = !Number.isNaN(numericUserId)
                  ? await storage.getUser(numericUserId)
                  : (await (storage as any).getUserByUid?.(
                      (tx as any).userUid ||
                        (tx as any).user_uid ||
                        (tx as any).user_id
                    )) || null;
                console.log("🔍 [USER LOOKUP RESULT] Withdrawal approval", {
                  txId: id,
                  userRaw: userRaw ? "FOUND" : "NULL",
                  userRawId: userRaw?.id,
                  userRawEmail: userRaw?.email,
                });
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
                    activeDeposits: "0",
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
                  try {
                    const primaryOk = await sendWithdrawalApprovedEmail(
                      user,
                      tx.amount,
                      tx.description || "Your crypto wallet"
                    );
                    emailSent = primaryOk;
                    emailOutcome = primaryOk
                      ? "primary-success"
                      : "primary-failed";
                    if (primaryOk) {
                      console.log("📧 Withdrawal approval email sent", {
                        txId: id,
                        to: user.email,
                        amount: tx.amount,
                      });
                    }
                    if (!primaryOk) {
                      try {
                        const { sendWithdrawalApprovedEmail: mgrSend } =
                          await import("./emailManager");
                        const fallbackOk = await mgrSend(
                          user,
                          tx.amount,
                          tx.description || "Your crypto wallet"
                        );
                        emailSent = fallbackOk;
                        emailOutcome = fallbackOk
                          ? "fallback-success"
                          : "fallback-failed";
                        if (fallbackOk) {
                          console.log(
                            "📧 Withdrawal approval email sent (fallback)",
                            { txId: id, to: user.email, amount: tx.amount }
                          );
                        } else if (!emailReason) {
                          emailReason = "primary_and_fallback_failed";
                        }
                      } catch (mgrErr) {
                        console.warn(
                          "Withdrawal approval email fallback failed",
                          mgrErr
                        );
                        emailReason = "fallback_exception";
                        emailOutcome = "fallback-exception";
                      }
                    }
                  } catch (primaryErr) {
                    console.warn(
                      "Withdrawal approval primary email threw",
                      primaryErr
                    );
                    emailSent = false;
                    emailOutcome = "primary-exception";
                  }
                } else {
                  emailReason = "user_lookup_failed";
                  emailOutcome = "user-lookup-failed";
                }
              } catch (emailErr) {
                console.error(
                  "Withdrawal approval email failed (non-fatal):",
                  emailErr
                );
                emailSent = false;
                emailReason = "exception";
                if (!emailOutcome) emailOutcome = "exception";
              }
              if (emailSent === false && !emailReason)
                emailReason = "unknown_failure";
              try {
                await storage.createLog({
                  type: emailSent ? "info" : "error",
                  message: "withdrawal_approval_email_result",
                  details: { txId: id, emailSent, emailReason, emailOutcome },
                  userId: (tx as any).userId || (tx as any).user_id || null,
                });
              } catch (logErr) {
                console.warn(
                  "Failed to persist withdrawal email result log",
                  logErr
                );
              }
              res.json({
                success: true,
                message: "Withdrawal approved",
                data: { ...updated, newBalance },
                emailSent,
                emailReason,
                emailOutcome,
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
            // Normalize field naming (snake_case -> camelCase) so the client
            // Admin Withdrawals/Transactions tables can reliably access these
            // properties without duplicating mapping logic in the frontend.
            const normalized = (transactions || []).map((tx: any) => ({
              ...tx,
              userId: tx.userId ?? tx.user_id ?? null,
              username: tx.users?.username ?? null,
              userEmail: tx.users?.email ?? null,
              planName: tx.planName ?? tx.plan_name ?? null,
              cryptoType: tx.cryptoType ?? tx.crypto_type ?? null,
              walletAddress: tx.walletAddress ?? tx.wallet_address ?? null,
              transactionHash:
                tx.transactionHash ?? tx.transaction_hash ?? null,
              planDuration: tx.planDuration ?? tx.plan_duration ?? null,
              dailyProfit: tx.dailyProfit ?? tx.daily_profit ?? null,
              totalReturn: tx.totalReturn ?? tx.total_return ?? null,
              createdAt: tx.createdAt ?? tx.created_at,
              updatedAt: tx.updatedAt ?? tx.updated_at,
            }));
            const totalPages = Math.ceil(total / limit) || 1;
            res.json({
              success: true,
              data: normalized,
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
      method: "DELETE",
      path: "/withdrawals/:id",
      registrar: (r) => {
        r.delete("/withdrawals/:id", async (req: Request, res: Response) => {
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
            const status = (tx.status || "").toLowerCase();
            if (status !== "completed" && status !== "approved") {
              return res.status(409).json({
                error:
                  "Only completed/approved withdrawals can be deleted by admin",
              });
            }
            const ok = await storage.deleteTransaction(id);
            if (!ok)
              return res
                .status(500)
                .json({ error: "Failed to delete transaction" });
            res.json({ success: true });
          } catch (error) {
            console.error("Error deleting withdrawal:", error);
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
            // Best-effort aggregate of activeDeposits across all users
            let totalActiveDeposits = 0;
            try {
              const allUsers = await storage.getAllUsers();
              totalActiveDeposits = (allUsers || []).reduce(
                (sum: number, u: any) =>
                  sum +
                  Number(
                    (u as any).activeDeposits ?? (u as any).active_deposits ?? 0
                  ),
                0
              );
            } catch (e) {
              console.warn("Failed to aggregate activeDeposits in summary", e);
            }
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
                  activeDeposits: totalActiveDeposits,
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
    {
      method: "GET",
      path: "/user-transactions",
      registrar: (r) => {
        r.get("/user-transactions", async (req: Request, res: Response) => {
          try {
            const page = parseInt((req.query.page as string) || "1", 10);
            const limit = parseInt((req.query.limit as string) || "20", 10);
            const offset = (page - 1) * limit;
            const sortBy = (req.query.sortBy as string) || "balance";
            const sortOrder = (req.query.sortOrder as string) || "desc";
            const search = (req.query.search as string) || "";

            // Get users with pagination and search
            const [users, total] = await Promise.all([
              storage.getUsers({
                limit,
                offset,
                search: search.trim() || undefined,
              }),
              storage.getUserCount({ search: search.trim() || undefined }),
            ]);

            // Calculate transaction stats for each user
            const usersWithStats = await Promise.all(
              (users || []).map(async (user) => {
                // Get user transactions using the dedicated method
                const userTransactions = await storage.getUserTransactions(
                  user.id
                );
                const depositCount = userTransactions.filter(
                  (tx) => tx.type === "deposit"
                ).length;
                const withdrawalCount = userTransactions.filter(
                  (tx) => tx.type === "withdrawal"
                ).length;

                // Get total deposits and withdrawals
                const deposits = userTransactions.filter(
                  (tx) => tx.type === "deposit"
                );
                const withdrawals = userTransactions.filter(
                  (tx) => tx.type === "withdrawal"
                );

                const totalDeposits =
                  deposits?.reduce(
                    (sum, tx) => sum + parseFloat((tx.amount as string) || "0"),
                    0
                  ) || 0;

                const totalWithdrawals =
                  withdrawals?.reduce(
                    (sum, tx) => sum + parseFloat((tx.amount as string) || "0"),
                    0
                  ) || 0;

                // Get last transaction date
                const allTransactions = [
                  ...(deposits || []),
                  ...(withdrawals || []),
                ].sort(
                  (a, b) =>
                    new Date(b.createdAt || 0).getTime() -
                    new Date(a.createdAt || 0).getTime()
                );

                // Normalize potential snake_case fields from DB to camelCase expected by frontend
                const bitcoinAddress =
                  (user as any).bitcoinAddress ||
                  (user as any).bitcoin_address ||
                  null;
                const bitcoinCashAddress =
                  (user as any).bitcoinCashAddress ||
                  (user as any).bitcoin_cash_address ||
                  null;
                const ethereumAddress =
                  (user as any).ethereumAddress ||
                  (user as any).ethereum_address ||
                  null;
                const usdtTrc20Address =
                  (user as any).usdtTrc20Address ||
                  (user as any).usdt_trc20_address ||
                  null;
                const bnbAddress =
                  (user as any).bnbAddress || (user as any).bnb_address || null;
                // Determine last transaction date (support created_at)
                const lastTx = allTransactions[0];
                const lastTransactionDate =
                  (lastTx as any)?.createdAt ||
                  (lastTx as any)?.created_at ||
                  null;
                return {
                  id: user.id,
                  email: user.email,
                  username:
                    (user as any).username ||
                    (user as any).full_name ||
                    user.email.split("@")[0],
                  firstName:
                    (user as any).firstName || (user as any).first_name || null,
                  lastName:
                    (user as any).lastName || (user as any).last_name || null,
                  balance: (user as any).balance || "0",
                  bitcoinAddress,
                  bitcoinCashAddress,
                  ethereumAddress,
                  usdtTrc20Address,
                  bnbAddress,
                  totalDeposits,
                  totalWithdrawals,
                  transactionCount: depositCount + withdrawalCount,
                  lastTransactionDate,
                };
              })
            );

            return res.status(200).json({
              data: usersWithStats,
              pagination: {
                page,
                limit,
                total: total || 0,
                totalPages: Math.ceil((total || 0) / limit),
              },
            });
          } catch (e: any) {
            console.error("User transactions endpoint error:", e);
            return res.status(500).json({
              error: "Internal server error",
              details: e?.message || String(e),
            });
          }
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
    console.log(`✅ Registering admin route ${spec.method} ${full}`);
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
