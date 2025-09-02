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
  sendDepositSuccessEmail,
  sendWithdrawalRequestEmail,
} from "./emailService";
import {
  applyDailyReturns,
  createInvestmentFromTransaction,
  getUserInvestmentReturns,
  getUserInvestments,
} from "./investmentService";
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
      // Use the real Supabase project JWT secret ONLY. The anon key is NOT the signing secret.
      const secret = process.env.SUPABASE_JWT_SECRET;
      const allowUnverified =
        process.env.SUPABASE_UNVERIFIED_FALLBACK === "true" ||
        process.env.ADMIN_JWT_ALLOW_UNVERIFIED === "true";
      let decoded: any = null;
      if (secret) {
        try {
          decoded = jwt.verify(token, secret as any);
        } catch (e) {
          decoded = null;
          (req as any).bearerVerifyFailed = true;
        }
      }
      if (!decoded && allowUnverified) {
        decoded = jwt.decode(token); // unsigned decode mapping (fallback)
        if (!decoded) {
          (req as any).bearerDecodeError = true;
        }
      }
      if (!decoded && !secret) {
        (req as any).bearerMappingFailed = true;
        (req as any).bearerMissingSecret = true;
      }
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
            verifyFailed: !!(req as any).bearerVerifyFailed,
            missingSecret: !!(req as any).bearerMissingSecret,
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

// Create profile via service role (used after Supabase auth sign-up)
router.post("/auth/create-profile", async (req: Request, res: Response) => {
  try {
    const { uid, email, username, firstName, lastName } = (req.body ||
      {}) as any;
    if (!uid || !email) {
      return res.status(400).json({ message: "uid and email are required" });
    }

    // If profile already exists, return it
    const existingByUid = await (storage as any).getUserByUid?.(uid);
    if (existingByUid) {
      return res.json({ user: mapUser(existingByUid) });
    }
    const existingByEmail = await (storage as any).getUserByEmail?.(email);
    if (existingByEmail) {
      return res.json({ user: mapUser(existingByEmail) });
    }

    // Create minimal profile; password is not stored (auth handled by Supabase)
    const created = await (storage as any).createUser?.({
      uid,
      username: username || email.split("@")[0],
      password: "", // placeholder; not used for Supabase auth
      email,
      firstName: firstName || "",
      lastName: lastName || "",
      role: "user",
      balance: "0",
      isActive: true,
      isVerified: true,
    });

    if (!created) {
      return res.status(500).json({ message: "Failed to create profile" });
    }
    // Ensure uid is stored if schema supports it
    try {
      const updated = await (storage as any).updateUser?.((created as any).id, {
        uid,
      });
      return res.status(201).json({ user: mapUser(updated || created) });
    } catch {
      return res.status(201).json({ user: mapUser(created) });
    }
  } catch (e: any) {
    console.error("/auth/create-profile error", e);
    res.status(500).json({ message: e?.message || "Internal error" });
  }
});

// --- Auth helpers for client login flow ---
// Resolve arbitrary identifier (email | username | auth uid) to an email
router.post("/auth/resolve-identifier", async (req: Request, res: Response) => {
  try {
    const { identifier } = (req.body as any) || {};
    if (!identifier || typeof identifier !== "string") {
      return res.status(400).json({ message: "identifier required" });
    }

    // If it's already an email, accept it
    if (identifier.includes("@")) {
      return res.json({ email: identifier });
    }

    // If it's a UUID (supabase auth uid), try map by uid first
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (uuidRegex.test(identifier)) {
      const byUid = await (storage as any).getUserByUid?.(identifier);
      if (byUid?.email) return res.json({ email: byUid.email });
    }

    // Otherwise, treat as username
    const user = await (storage as any).getUserByUsername?.(identifier);
    if (user?.email) return res.json({ email: user.email });

    return res.status(404).json({ message: "User not found" });
  } catch (e) {
    console.error("/auth/resolve-identifier error", e);
    res.status(500).json({ message: "Internal error" });
  }
});

// Provide a lightweight diagnostic for failed logins (best-effort)
router.post("/auth/diagnose-login", async (req: Request, res: Response) => {
  try {
    const { identifier } = (req.body as any) || {};
    if (!identifier || typeof identifier !== "string") {
      return res
        .status(400)
        .json({ code: "bad_request", message: "identifier required" });
    }

    let user: any | null = null;
    if (identifier.includes("@")) {
      user = await (storage as any).getUserByEmail?.(identifier);
    } else {
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (uuidRegex.test(identifier)) {
        user = await (storage as any).getUserByUid?.(identifier);
      } else {
        user = await (storage as any).getUserByUsername?.(identifier);
      }
    }

    if (!user) {
      return res
        .status(404)
        .json({ code: "username_not_found", message: "Username not found." });
    }

    // Normalize active flag from either is_active or isActive
    const isActive =
      (user as any).is_active === undefined
        ? (user as any).isActive
        : (user as any).is_active;
    if (isActive === false) {
      return res.status(403).json({
        code: "account_deactivated",
        message: "Account is deactivated.",
      });
    }

    // If user exists and active, return generic message; password validation happens via Supabase
    return res.json({ code: "ok", message: "User exists" });
  } catch (e) {
    console.error("/auth/diagnose-login error", e);
    res.status(500).json({ code: "server_error", message: "Internal error" });
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
  const activeDeposits = Number((user as any).activeDeposits || 0);
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
    activeDeposits,
    pendingDeposits: pendingDepositTxs.length,
    pendingWithdrawals: pendingWithdrawalTxs.length,
    pendingWithdrawalAmount,
    pendingDepositAmount: pendingBalance,
    lastUpdated: new Date().toISOString(),
    // Legacy fields for older client code
    balance: String(availableBalance),
    activeDeposits: String(activeDeposits),
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
      const typeFilter = (req.query.type as string) || undefined;
      const statusFilter = (req.query.status as string) || undefined;
      const raw = await storage.getUserTransactions(id);
      const filtered = raw.filter((t: any) => {
        const typeOk = typeFilter ? t.type === typeFilter : true;
        const statusOk = statusFilter ? t.status === statusFilter : true;
        return typeOk && statusOk;
      });
      const normalize = (t: any) => ({
        id: t.id,
        userId: t.userId ?? t.user_id,
        type: t.type,
        amount: t.amount,
        status: t.status,
        description: t.description,
        createdAt: t.createdAt || t.created_at,
        updatedAt: t.updatedAt || t.updated_at,
        cryptoType: t.cryptoType ?? t.crypto_type,
        walletAddress: t.walletAddress ?? t.wallet_address,
        transactionHash: t.transactionHash ?? t.transaction_hash,
        planName: t.planName ?? t.plan_name,
        planDuration: t.planDuration ?? t.plan_duration,
        dailyProfit: t.dailyProfit ?? t.daily_profit,
        totalReturn: t.totalReturn ?? t.total_return,
      });
      res.json({ transactions: filtered.slice(0, limit).map(normalize) });
    } catch (e) {
      console.error("transactions list error", e);
      res.status(500).json({ message: "Failed to get transactions" });
    }
  }
);

// Automatic Investment Deposit -> pending approval (admin must approve before activating)
router.post(
  "/transactions/investment-deposit",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { amount, planName, transactionHash, method } = req.body || {};
      const numericAmount = Number(amount);

      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }

      if (!planName) {
        return res.status(400).json({ message: "Investment plan is required" });
      }

      // Validate investment plan
      const { INVESTMENT_PLANS } = await import("./investmentService");
      const plan = INVESTMENT_PLANS.find((p) => p.name === planName);
      if (!plan) {
        return res.status(400).json({ message: "Invalid investment plan" });
      }

      if (
        numericAmount < plan.minAmount ||
        (plan.maxAmount && numericAmount > plan.maxAmount)
      ) {
        return res.status(400).json({
          message: `Amount must be between $${plan.minAmount} and $${plan.maxAmount || "unlimited"} for ${planName}`,
        });
      }

      // Calculate investment returns
      const dailyProfit = (numericAmount * plan.dailyProfit) / 100;
      const totalReturn = (numericAmount * plan.totalReturn) / 100;

      // Create PENDING deposit transaction (admin approval required)
      const tx = await storage.createTransaction({
        userId: req.user!.id,
        userUid: (req.user as any).uid,
        type: "deposit",
        amount: String(numericAmount),
        status: "pending", // Admin approval required
        description: `Investment Deposit - ${planName}`,
        transactionHash: transactionHash || null,
        planName: planName,
        planDuration: `${plan.duration} days`,
        dailyProfit: dailyProfit,
        totalReturn: totalReturn,
      });

      if (!tx) {
        return res
          .status(500)
          .json({ message: "Failed to create investment deposit" });
      }

      // Return success response with pending status
      return res.status(201).json({
        success: true,
        message: "Investment deposit submitted for admin approval",
        data: {
          transaction: tx,
          plan: plan,
          dailyReturn: dailyProfit,
          totalReturn: totalReturn,
          investmentPeriod: plan.duration,
          status: "pending_approval",
        },
      });
    } catch (e) {
      console.error("investment-deposit error", e);
      res.status(500).json({ message: "Failed to process investment deposit" });
    }
  }
);

// Reinvest endpoint: move available balance into activeDeposits immediately (no admin approval)
router.post(
  "/transactions/reinvest",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { amount, planName } = req.body || {};
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      if (!planName) {
        return res.status(400).json({ message: "Investment plan is required" });
      }
      // Validate plan
      const { INVESTMENT_PLANS } = await import("./investmentService");
      const plan = INVESTMENT_PLANS.find((p) => p.name === planName);
      if (!plan)
        return res.status(400).json({ message: "Invalid investment plan" });
      if (
        numericAmount < plan.minAmount ||
        (plan.maxAmount && numericAmount > plan.maxAmount)
      ) {
        return res.status(400).json({
          message: `Amount must be between $${plan.minAmount} and ${plan.maxAmount || "unlimited"}`,
        });
      }
      // Check balance
      const user = await storage.getUser(req.user!.id);
      const available = Number((user as any).balance || 0);
      if (numericAmount > available) {
        return res.status(409).json({ message: "Insufficient balance" });
      }
      // Move funds from balance to activeDeposits atomically
      const updated = await storage.adjustUserActiveDeposits(
        req.user!.id,
        numericAmount,
        { moveWithBalance: true }
      );
      if (!updated) {
        return res
          .status(500)
          .json({ message: "Failed to lock funds for reinvestment" });
      }
      // Record an investment transaction (completed) for audit
      const dailyProfit = (numericAmount * plan.dailyProfit) / 100;
      const totalReturn = (numericAmount * plan.totalReturn) / 100;
      const tx = await storage.createTransaction({
        userId: req.user!.id,
        userUid: (req.user as any).uid,
        type: "investment",
        amount: String(numericAmount),
        status: "completed",
        description: `Reinvest - ${planName}`,
        planName: planName,
        planDuration: `${plan.duration} days`,
        dailyProfit: dailyProfit,
        totalReturn: totalReturn,
      });

      // Create investment record for profit processing
      const { createInvestmentFromTransaction, scheduleFirstProfit } =
        await import("./investmentService");
      const investment = await createInvestmentFromTransaction(tx.id);
      if (investment) {
        // Schedule first profit for 24 hours from now
        await scheduleFirstProfit(investment.id);
        console.log(
          `[reinvest] Created investment ${investment.id} for reinvestment transaction ${tx.id}`
        );
      } else {
        console.error(
          `[reinvest] Failed to create investment record for transaction ${tx.id}`
        );
      }

      return res.status(201).json({
        success: true,
        message: "Reinvestment successful",
        data: {
          transaction: tx,
          investment: investment,
          lockedAmount: numericAmount,
          activeDeposits: (updated as any).activeDeposits,
          balance: (updated as any).balance,
          plan: plan,
        },
      });
    } catch (e) {
      console.error("reinvest error", e);
      res.status(500).json({ message: "Failed to process reinvestment" });
    }
  }
);

// TEMPORARY TEST ENDPOINT - Remove after testing
router.post(
  "/transactions/reinvest-test",
  async (req: Request, res: Response) => {
    try {
      const { userId, amount, planName } = req.body || {};
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      if (!planName) {
        return res.status(400).json({ message: "Investment plan is required" });
      }
      if (!userId || userId !== 24) {
        return res
          .status(400)
          .json({ message: "Test endpoint only for user ID 24" });
      }

      console.log(
        `[TEST] Starting reinvestment for user ${userId}, amount: ${numericAmount}, plan: ${planName}`
      );

      // Validate plan
      const { INVESTMENT_PLANS } = await import("./investmentService");
      const plan = INVESTMENT_PLANS.find((p) => p.name === planName);
      if (!plan)
        return res.status(400).json({ message: "Invalid investment plan" });

      // Check balance
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const available = Number((user as any).balance || 0);
      console.log(
        `[TEST] User balance: ${available}, requested: ${numericAmount}`
      );

      if (numericAmount > available) {
        return res.status(409).json({ message: "Insufficient balance" });
      }

      // Move funds from balance to activeDeposits atomically
      console.log(`[TEST] Moving funds from balance to activeDeposits...`);
      const updated = await storage.adjustUserActiveDeposits(
        userId,
        numericAmount,
        { moveWithBalance: true }
      );

      if (!updated) {
        console.error(`[TEST] Failed to adjust user activeDeposits`);
        return res
          .status(500)
          .json({ message: "Failed to lock funds for reinvestment" });
      }

      console.log(
        `[TEST] Funds moved successfully. New balance: ${(updated as any).balance}, New activeDeposits: ${(updated as any).activeDeposits}`
      );

      // Record an investment transaction (completed) for audit
      const dailyProfit = (numericAmount * plan.dailyProfit) / 100;
      const totalReturn = (numericAmount * plan.totalReturn) / 100;

      console.log(`[TEST] Creating transaction record...`);
      const tx = await storage.createTransaction({
        userId: userId,
        userUid: (user as any).uid,
        type: "investment",
        amount: String(numericAmount),
        status: "completed",
        description: `Reinvest - ${planName}`,
        planName: planName,
        planDuration: `${plan.duration} days`,
        dailyProfit: dailyProfit,
        totalReturn: totalReturn,
      });

      console.log(`[TEST] Transaction created with ID: ${tx.id}`);

      // Create investment record for profit processing
      const { createInvestmentFromTransaction, scheduleFirstProfit } =
        await import("./investmentService");

      console.log(`[TEST] Creating investment record...`);
      const investment = await createInvestmentFromTransaction(tx.id);
      if (investment) {
        // Schedule first profit for 24 hours from now
        await scheduleFirstProfit(investment.id);
        console.log(
          `[TEST] Created investment ${investment.id} for transaction ${tx.id}`
        );
      } else {
        console.error(
          `[TEST] Failed to create investment record for transaction ${tx.id}`
        );
      }

      return res.status(201).json({
        success: true,
        message: "Test reinvestment successful",
        data: {
          transaction: tx,
          investment: investment,
          lockedAmount: numericAmount,
          activeDeposits: (updated as any).activeDeposits,
          balance: (updated as any).balance,
          plan: plan,
        },
      });
    } catch (e) {
      console.error("test reinvest error", e);
      res
        .status(500)
        .json({
          message: "Failed to process test reinvestment",
          error: e.message,
        });
    }
  }
);

// Withdrawal request -> create pending withdrawal & send withdrawal request email
router.post(
  "/transactions/withdraw",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { amount, destination, method } = req.body || {};
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      // Deduct funds immediately to hold the balance
      const user = await storage.getUser(req.user!.id);
      const available = Number((user as any)?.balance || 0);
      if (numericAmount > available) {
        return res.status(409).json({ message: "Insufficient funds" });
      }
      const debited = await storage.adjustUserBalance(
        req.user!.id,
        -numericAmount
      );
      if (!debited) {
        return res.status(500).json({ message: "Failed to hold funds" });
      }
      let tx = await storage.createTransaction({
        userId: req.user!.id,
        userUid: (req.user as any).uid,
        type: "withdrawal",
        amount: String(numericAmount),
        status: "pending",
        description: destination
          ? `Withdrawal to ${destination}`
          : "Withdrawal request",
        cryptoType: method || null,
        walletAddress: destination || null,
      });
      if (!tx) {
        // Rollback the debit if we couldn't create the transaction
        await storage.adjustUserBalance(req.user!.id, numericAmount);
      }
      if (tx) {
        let emailOutcome = "skipped";
        try {
          const freshUser = await storage.getUser(req.user!.id);
          if (freshUser) {
            const primary = await sendWithdrawalRequestEmail(
              freshUser as any,
              String(numericAmount)
            );
            emailOutcome = primary ? "primary-success" : "primary-failed";
            if (!primary) {
              try {
                const { sendWithdrawalRequestEmail: mgrFn } = await import(
                  "./emailManager"
                );
                const fallbackOk = await mgrFn(
                  freshUser as any,
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
          newBalance: Number((debited as any)?.balance || 0),
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

// Balance deposit (instant, no admin approval): deduct from available balance and create a completed deposit
router.post(
  "/transactions/deposit",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { amount, method, planName } = req.body || {};
      const numericAmount = Number(amount);
      if (!numericAmount || numericAmount <= 0) {
        return res.status(400).json({ message: "Invalid amount" });
      }
      if ((method || "").toLowerCase() !== "balance") {
        return res.status(400).json({ message: "Unsupported method" });
      }
      const user = await storage.getUser(req.user!.id);
      if (!user) return res.status(404).json({ message: "User not found" });
      const available = Number((user as any).balance || 0);
      if (numericAmount > available) {
        return res.status(409).json({ message: "Insufficient funds" });
      }
      const debited = await storage.adjustUserBalance(
        req.user!.id,
        -numericAmount
      );
      if (!debited) {
        return res.status(500).json({ message: "Failed to debit balance" });
      }
      let tx = await storage.createTransaction({
        userId: req.user!.id,
        userUid: (req.user as any).uid,
        type: "deposit",
        amount: String(numericAmount),
        status: "completed",
        description: planName
          ? `Balance deposit - ${planName}`
          : "Balance deposit",
      });
      if (!tx) {
        // rollback the debit if we couldn't record the tx
        await storage.adjustUserBalance(req.user!.id, numericAmount);
        return res.status(500).json({ message: "Failed to record deposit" });
      }
      // Send deposit confirmation email for instant balance deposit
      try {
        await sendDepositSuccessEmail(
          user as any,
          String(numericAmount),
          planName
        );
      } catch (emailErr) {
        console.warn("Balance deposit success email failed", emailErr);
      }
      return res.status(201).json({
        success: true,
        data: {
          transaction: tx,
          newBalance: Number((debited as any)?.balance || 0),
        },
      });
    } catch (e) {
      console.error("balance deposit error", e);
      res.status(500).json({ message: "Failed to process deposit" });
    }
  }
);

// Deposit confirmation endpoint - handles crypto/external deposit confirmations
router.post(
  "/transactions/deposit-confirmation",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { transactionHash, amount, method, planName } = req.body || {};

      // Validate required fields
      if (!transactionHash) {
        return res
          .status(400)
          .json({ message: "Transaction hash is required" });
      }
      if (!amount || typeof amount !== "number" || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      if (!method) {
        return res.status(400).json({ message: "Payment method is required" });
      }

      const numericAmount = Number(amount);

      // Create deposit transaction record
      const tx = await storage.createTransaction({
        userId: req.user!.id,
        userUid: (req.user as any).uid,
        type: "deposit",
        amount: String(numericAmount),
        status: "pending", // Admin approval required for external deposits
        description: planName
          ? `Deposit confirmation - ${planName}`
          : "Deposit confirmation",
        transactionHash: transactionHash,
        cryptoType: method,
        planName: planName || null,
      });

      if (!tx) {
        return res
          .status(500)
          .json({ message: "Failed to create deposit transaction" });
      }

      // Return success response
      return res.status(201).json({
        success: true,
        message: "Deposit confirmation submitted successfully",
        data: {
          transaction: tx,
          transactionHash,
          amount: numericAmount,
          method,
          planName,
          status: "pending_approval",
        },
      });
    } catch (e) {
      console.error("deposit-confirmation error", e);
      res
        .status(500)
        .json({ message: "Failed to process deposit confirmation" });
    }
  }
);

// Investment calculation endpoints
router.post(
  "/investment/calculate",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { principalAmount, currentBalance = 0 } = req.body || {};

      if (
        !principalAmount ||
        typeof principalAmount !== "number" ||
        principalAmount <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Valid principal amount is required" });
      }

      // Import actual investment plans from investment service
      const { INVESTMENT_PLANS } = await import("./investmentService");

      const calculations = INVESTMENT_PLANS.map((plan) => {
        // Check if principal amount is within plan limits
        const isWithinLimits =
          principalAmount >= plan.minAmount &&
          (plan.maxAmount === null || principalAmount <= plan.maxAmount);

        if (!isWithinLimits) {
          return null; // Skip plans that don't match the amount
        }

        // Calculate daily return
        const dailyReturn = (principalAmount * plan.dailyProfit) / 100;

        // Calculate returns for different periods
        const totalReturn24h = dailyReturn * 1;
        const totalReturn30d = dailyReturn * 30;
        const totalReturnPlan = dailyReturn * plan.duration;

        // Calculate projected balances
        const projectedBalance24h =
          currentBalance + principalAmount + totalReturn24h;
        const projectedBalance30d =
          currentBalance + principalAmount + totalReturn30d;
        const projectedBalanceEnd =
          currentBalance + principalAmount + totalReturnPlan;

        return {
          planId: plan.id,
          planName: plan.name,
          principalAmount,
          dailyReturn,
          totalReturn24h,
          totalReturn30d,
          totalReturnPlan,
          projectedBalance24h,
          projectedBalance30d,
          projectedBalanceEnd,
          durationDays: plan.duration,
          returnPercentage: plan.dailyProfit,
          minAmount: plan.minAmount,
          maxAmount: plan.maxAmount,
          totalReturnPercentage: plan.totalReturn,
        };
      }).filter(Boolean); // Remove null entries for plans that don't match

      // Find recommended plan (first available plan that matches the amount)
      const recommendedPlan = calculations.length > 0 ? calculations[0] : null;

      res.json({
        calculations,
        currentBalance,
        recommendedPlan,
      });
    } catch (error) {
      console.error("Investment calculation error:", error);
      res
        .status(500)
        .json({ message: "Failed to calculate investment projections" });
    }
  }
);

// Get investment plans
router.get("/investment/plans", async (req: Request, res: Response) => {
  try {
    // Import actual investment plans from investment service
    const { INVESTMENT_PLANS } = await import("./investmentService");

    res.json({
      plans: INVESTMENT_PLANS,
    });
  } catch (error) {
    console.error("Get investment plans error:", error);
    res.status(500).json({ message: "Failed to get investment plans" });
  }
});

// Apply investment returns (for simulation/testing)
router.post(
  "/investment/apply-returns",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const { planId, principalAmount, daysElapsed = 1 } = req.body || {};

      if (
        !planId ||
        !principalAmount ||
        typeof principalAmount !== "number" ||
        principalAmount <= 0
      ) {
        return res
          .status(400)
          .json({ message: "Valid plan ID and principal amount are required" });
      }

      // Get plan details
      const plans = [
        { id: "starter", returnRate: "5-8% Monthly", duration: "3 Months" },
        { id: "growth", returnRate: "8-12% Monthly", duration: "6 Months" },
        { id: "premium", returnRate: "12-18% Monthly", duration: "12 Months" },
      ];

      const plan = plans.find((p) => p.id === planId);
      if (!plan) {
        return res.status(400).json({ message: "Invalid plan ID" });
      }

      // Calculate returns
      const returnRateMatch = plan.returnRate.match(/(\d+)-(\d+)%/);
      const returnPercentage = returnRateMatch
        ? (parseInt(returnRateMatch[1]) + parseInt(returnRateMatch[2])) / 2
        : 5;

      const dailyReturnRate = returnPercentage / 100 / 30;
      const returnsEarned = principalAmount * dailyReturnRate * daysElapsed;
      const newBalance = principalAmount + returnsEarned;

      // In a real implementation, you would update the user's balance here
      // For now, we'll just return the calculation
      res.json({
        success: true,
        planId,
        principalAmount,
        returnsEarned,
        newBalance,
        daysElapsed,
        message: `Successfully calculated returns for ${daysElapsed} day(s)`,
      });
    } catch (error) {
      console.error("Apply investment returns error:", error);
      res.status(500).json({ message: "Failed to apply investment returns" });
    }
  }
);

// Investment Management Endpoints

// Get user's active investments
router.get("/investments", requireAuth, async (req: Request, res: Response) => {
  try {
    const investments = await getUserInvestments(req.user!.id);
    res.json({ investments });
  } catch (error) {
    console.error("Get investments error:", error);
    res.status(500).json({ message: "Failed to get investments" });
  }
});

// Get user's investment returns
router.get(
  "/investments/returns",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      const returns = await getUserInvestmentReturns(req.user!.id);
      res.json({ returns });
    } catch (error) {
      console.error("Get investment returns error:", error);
      res.status(500).json({ message: "Failed to get investment returns" });
    }
  }
);

// Apply daily returns (admin/manual trigger)
router.post(
  "/investments/apply-returns",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      await applyDailyReturns();
      res.json({ message: "Daily returns applied successfully" });
    } catch (error) {
      console.error("Apply daily returns error:", error);
      res.status(500).json({ message: "Failed to apply daily returns" });
    }
  }
);

// Create investment from completed transaction (internal endpoint)
router.post(
  "/investments/create-from-transaction/:transactionId",
  requireAuth,
  async (req: Request, res: Response) => {
    try {
      if (req.user!.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const transactionId = parseInt(req.params.transactionId, 10);
      if (isNaN(transactionId)) {
        return res.status(400).json({ message: "Invalid transaction ID" });
      }

      const investment = await createInvestmentFromTransaction(transactionId);
      if (!investment) {
        return res
          .status(400)
          .json({ message: "Failed to create investment from transaction" });
      }

      res.json({ investment });
    } catch (error) {
      console.error("Create investment from transaction error:", error);
      res.status(500).json({ message: "Failed to create investment" });
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
  // Compute owner flag on the server so clients don't need public VITE_* envs
  const ownerId = process.env.OWNER_USER_ID;
  const ownerEmail = process.env.OWNER_EMAIL;
  const ownerUid = process.env.OWNER_UID;
  const isOwner =
    (!!ownerId && String(u.id) === String(ownerId)) ||
    (!!ownerEmail &&
      u.email &&
      String(u.email).toLowerCase() === String(ownerEmail).toLowerCase()) ||
    (!!ownerUid &&
      (u.uid || (u as any).auth_uid) &&
      String(u.uid || (u as any).auth_uid) === String(ownerUid));
  return {
    id: u.id,
    email: u.email,
    role: u.role ?? "user",
    username: (u as any).username ?? null,
    firstName: (u as any).firstName ?? null,
    lastName: (u as any).lastName ?? null,
    isOwner,
  };
}

export default router;
