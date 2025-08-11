// Minimal clean routes.ts baseline (Phase 1)
// Only core user + health + email verification + dev test email endpoints.
// IMPORTANT: Do NOT add admin/transaction/audit routes yet.

import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import jwt from "jsonwebtoken";
import { Resend } from "resend";
import { resendVerificationEmail, verifyUserEmail } from "./auth";
import { handleEmailChange } from "./emailChangeService";
import {
  initializeEmailTransporter,
  sendWithdrawalRequestEmail,
} from "./emailService";
import { DatabaseStorage } from "./storage";

const router = express.Router();
const storage = new DatabaseStorage();

// Best-effort bearer token -> user resolution supporting Supabase access tokens
router.use(async (req, _res, next) => {
  const authHeader =
    req.headers.authorization || (req.headers as any).Authorization;
  if (
    !req.user &&
    typeof authHeader === "string" &&
    authHeader.startsWith("Bearer ")
  ) {
    const token = authHeader.slice(7).trim();
    (req as any).bearerPresent = true;
    try {
      const decoded: any = jwt.decode(token); // unsigned decode for mapping only
      // Supabase JWT: sub = auth user uuid
      const uid: string | undefined = decoded?.sub;
      let mappedUser: any = null;
      if (uid && typeof uid === "string" && uid.length >= 16) {
        mappedUser = await (storage as any).getUserByUid?.(uid);
        if (mappedUser) (req as any).bearerMappedBy = "uid";
      }
      // Fallbacks: numeric id, userId claim, email
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
      if (mappedUser) {
        (req as any).user = mappedUser;
      } else {
        (req as any).bearerMappingFailed = true;
      }
    } catch (e) {
      (req as any).bearerDecodeError = true;
    }
  }
  next();
});

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({
      message: "Unauthorized",
      bearer: (req as any).bearerPresent
        ? {
            present: true,
            mappedBy: (req as any).bearerMappedBy || null,
            mappingFailed: !!(req as any).bearerMappingFailed,
            decodeError: !!(req as any).bearerDecodeError,
          }
        : undefined,
    });
  }
  next();
}

// Health & status
router.get("/ping", (_req, res) => res.json({ ok: true, ts: Date.now() }));
router.get("/health", (_req, res) => res.json({ status: "ok" }));

// Send welcome email explicitly (client may call after registration)
router.post("/send-welcome-email", async (req, res) => {
  try {
    const { email, username, firstName, lastName, password } = req.body || {};
    if (!email) return res.status(400).json({ message: "Email required" });
    // Prefer stored user record if exists
    let user = await (storage as any).getUserByEmail?.(email);
    if (!user) {
      user = {
        id: 0,
        email,
        username: username || email,
        firstName: firstName || null,
        lastName: lastName || null,
      };
    }
    const { sendWelcomeEmail } = await import("./emailManager");
    const ok = await sendWelcomeEmail({
      ...(user as any),
      plainPassword: password || null,
    } as any);
    if (!ok)
      return res.status(500).json({ message: "Failed to send welcome email" });
    res.json({ message: "Welcome email sent", success: true });
  } catch (e: any) {
    console.error("/send-welcome-email error", e);
    res.status(500).json({ message: e?.message || "Internal error" });
  }
});

// Email verification
router.post("/verify-email", async (req: Request, res: Response) => {
  try {
    const { token } = req.body || {};
    if (!token) return res.status(400).json({ message: "Token required" });
    const result = await verifyUserEmail(token);
    if (!result || !result.user)
      return res.status(400).json({ message: "Invalid or expired token" });
    res.json({ message: "Email verified", user: mapUser(result.user) });
  } catch (e) {
    console.error("verify-email error", e);
    res.status(500).json({ message: "Failed to verify email" });
  }
});

router.post(
  "/resend-verification",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      await resendVerificationEmail(req.user!.id);
      res.json({ message: "Verification email sent" });
    } catch (e) {
      console.error("resend-verification error", e);
      res.status(500).json({ message: "Failed to resend verification" });
    }
  }
);

// Profile routes
router.get("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    if (!req.user) return res.status(401).json({ message: "Unauthorized" });
    const user = await storage.getUser(req.user!.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json({ user: mapUser(user) });
  } catch (e) {
    console.error("profile get error", e);
    res.status(500).json({ message: "Failed to get profile" });
  }
});

router.put("/profile", requireAuth, async (req: Request, res: Response) => {
  try {
    const { username, firstName, lastName } = req.body || {};
    const updated = await storage.updateUser(req.user!.id, {
      username,
      firstName,
      lastName,
    });
    if (!updated)
      return res.status(400).json({ message: "Failed to update profile" });
    res.json({ user: mapUser(updated) });
  } catch (e) {
    console.error("profile update error", e);
    res.status(500).json({ message: "Failed to update profile" });
  }
});

// Email change
router.post(
  "/update-email",
  requireAuth,
  async (req: Request, res: Response) => {
    await handleEmailChange(req, res);
  }
);

// --- Transactions & Balance (minimal) ---

// Helper to shape balance response consistently
async function buildBalanceResponse(userId: number) {
  const user = await storage.getUser(userId);
  if (!user) return null;
  const txs = await storage.getUserTransactions(userId);
  const pendingDepositTxs = txs.filter(
    (t) => t.type === "deposit" && t.status === "pending"
  );
  const pendingWithdrawalTxs = txs.filter(
    (t) => t.type === "withdrawal" && t.status === "pending"
  );
  const availableBalance = Number((user as any).balance || 0);
  const pendingBalance = pendingDepositTxs.reduce(
    (sum, t) => sum + (parseFloat((t as any).amount) || 0),
    0
  );
  const pendingWithdrawalAmount = pendingWithdrawalTxs.reduce(
    (sum, t) => sum + (parseFloat((t as any).amount) || 0),
    0
  );
  return {
    userId: user.id,
    availableBalance,
    pendingBalance,
    totalBalance: availableBalance + pendingBalance,
    pendingDeposits: pendingDepositTxs.length,
    pendingWithdrawals: pendingWithdrawalTxs.length,
    pendingWithdrawalAmount,
    pendingDepositAmount: pendingBalance,
    // Legacy fields for older client code
    balance: String(availableBalance),
  };
}

// Get user balance (explicit user id)
router.get("/users/:id/balance", requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    if (Number.isNaN(id))
      return res.status(400).json({ message: "Invalid user id" });
    if (req.user!.id !== id && req.user!.role !== "admin") {
      return res.status(403).json({ message: "Forbidden" });
    }
    const payload = await buildBalanceResponse(id);
    if (!payload) return res.status(404).json({ message: "User not found" });
    res.json(payload);
  } catch (e) {
    console.error("balance get error", e);
    res.status(500).json({ message: "Failed to get balance" });
  }
});

// Current user balance (no id) for client convenience
router.get("/balance", requireAuth, async (req, res) => {
  try {
    const payload = await buildBalanceResponse(req.user!.id);
    if (!payload) return res.status(404).json({ message: "User not found" });
    res.json(payload);
  } catch (e) {
    console.error("/balance error", e);
    res.status(500).json({ message: "Failed to get balance" });
  }
});

// List user transactions (paginated minimal)
router.get(
  "/users/:id/transactions",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id, 10);
      if (Number.isNaN(id))
        return res.status(400).json({ message: "Invalid user id" });
      if (req.user!.id !== id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "Forbidden" });
      }
      const limit = Math.min(
        100,
        parseInt((req.query.limit as string) || "20", 10) || 20
      );
      const txs = await storage.getUserTransactions(id);
      res.json({ transactions: txs.slice(0, limit) });
    } catch (e) {
      console.error("transactions list error", e);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  }
);

// Deposit confirmation -> create pending deposit transaction & send deposit request email
router.post(
  "/transactions/deposit-confirmation",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { amount, transactionHash, method, planName } = req.body || {};
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      if (process.env.NODE_ENV !== "production") {
        console.log("[deposit-debug] user=", req.user?.id, "payload=", {
          amount: numericAmount,
          hasHash: !!transactionHash,
          method,
          planName,
        });
      }
      const tx = await storage.createTransaction({
        userId: req.user!.id,
        userUid: (req.user as any).uid, // pass auth uid for uuid user_id column
        type: "deposit",
        amount: String(numericAmount),
        status: "pending",
        description: planName
          ? `Deposit request - ${planName}`
          : "Deposit request",
        transactionHash: transactionHash || null,
      });
      if (tx) {
        // Per updated requirement: do NOT send an email on deposit request submission.
        // Only admin approval will trigger a deposit approval email elsewhere.
        return res.status(201).json({ success: true, transaction: tx });
      }
      return res.status(500).json({
        message: "Failed to create deposit",
        debug:
          process.env.NODE_ENV !== "production"
            ? "createTransaction returned undefined"
            : undefined,
      });
    } catch (e) {
      console.error("deposit-confirmation error", e);
      res.status(500).json({ message: "Failed to submit deposit" });
    }
  }
);

// Withdrawal request -> create pending withdrawal & send withdrawal request email
router.post(
  "/transactions/withdraw",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { amount, destination } = req.body || {};
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      const tx = await storage.createTransaction({
        userId: req.user!.id,
        type: "withdrawal",
        amount: String(numericAmount),
        status: "pending",
        description: destination
          ? `Withdrawal to ${destination}`
          : "Withdrawal request",
      });
      if (tx) {
        let emailOutcome = "skipped";
        try {
          const user = await storage.getUser(req.user!.id);
          if (user) {
            const primary = await sendWithdrawalRequestEmail(
              user as any,
              String(numericAmount)
            );
            emailOutcome = primary ? "primary-success" : "primary-failed";
            if (!primary) {
              try {
                const { sendWithdrawalRequestEmail: mgrFn } = await import(
                  "./emailManager"
                );
                const fallbackOk = await mgrFn(
                  user as any,
                  String(numericAmount),
                  undefined
                );
                emailOutcome = fallbackOk
                  ? "fallback-success"
                  : "fallback-failed";
              } catch (fallbackErr) {
                console.warn(
                  "Withdrawal email fallback threw error",
                  fallbackErr
                );
              }
            }
          }
        } catch (emailErr) {
          console.warn("Withdrawal request email failed (non-fatal)", emailErr);
        }
        return res.status(201).json({
          success: true,
          transaction: tx,
          email:
            process.env.NODE_ENV !== "production" ? emailOutcome : undefined,
        });
      }
      res.status(500).json({ message: "Failed to create withdrawal" });
    } catch (e) {
      console.error("withdraw request error", e);
      res.status(500).json({ message: "Failed to submit withdrawal" });
    }
  }
);

// Test email endpoint (dev only)
if (process.env.NODE_ENV !== "production") {
  router.get("/test-email", async (req: Request, res: Response) => {
    const to = (req.query.email as string) || "you@example.com";
    const payload = {
      from: process.env.EMAIL_FROM || "onboarding@resend.dev",
      to,
      subject: "🚀 AxixFinance Test Email",
      html: `<p>Test email sent at ${new Date().toISOString()}</p>`,
    };
    try {
      const key = process.env.RESEND_API_KEY;
      if (!key) throw new Error("RESEND_API_KEY not set");
      const client = new Resend(key);
      const resp = await client.emails.send(payload);
      res.json({ success: true, resp });
    } catch (err) {
      console.error("test-email error", err);
      res.status(500).json({ success: false, error: (err as Error).message });
    }
  });

  router.get("/debug/email-config", async (_req, res) => {
    const configured = !!(
      process.env.RESEND_API_KEY ||
      (process.env.SMTP_HOST &&
        process.env.SMTP_USER &&
        process.env.SMTP_PASSWORD)
    );
    res.json({
      configured,
      env: {
        EMAIL_FROM: process.env.EMAIL_FROM,
        RESEND_API_KEY: !!process.env.RESEND_API_KEY,
        SMTP_HOST: process.env.SMTP_HOST,
        EMAIL_DEV_MODE: process.env.EMAIL_DEV_MODE,
      },
    });
  });

  router.get("/debug/email-transporter", async (_req, res) => {
    await initializeEmailTransporter();
    const state = {
      hasTransporter: !!(require("./emailService") as any).transporter,
      etherealAccount:
        (require("./emailService") as any).etherealAccount || null,
      devMode: (require("./emailService") as any).isDevMode || false,
      hasResendKey: !!process.env.RESEND_API_KEY,
    };
    res.json(state);
  });
}

// Visitor tracking no-op endpoints (always enabled to avoid 404 noise)
router.put("/visitors/activity", (_req, res) => {
  res.json({ ok: true, updatedAt: new Date().toISOString() });
});
router.post("/visitors/track", (_req, res) => {
  res.json({ ok: true, trackedAt: new Date().toISOString() });
});
router.post("/visitors/session", (_req, res) => {
  res.json({ ok: true, session: "started", ts: new Date().toISOString() });
});
router.delete("/visitors/session", (_req, res) => {
  res.json({ ok: true, session: "ended", ts: new Date().toISOString() });
});

// User mapping function
function mapUser(u: any) {
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    role: u.role ?? "user",
    username: (u as any).username ?? null,
    firstName: (u as any).firstName ?? null,
    lastName: (u as any).lastName ?? null,
  };
}

export default router;
