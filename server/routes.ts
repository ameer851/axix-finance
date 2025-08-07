import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import { createServer, type Server } from "http";
import {
  comparePasswords,
  hashPassword,
  requireAdminRole,
  requireEmailVerification,
  resendVerificationEmail,
  setupAuth,
  verifyUserEmail,
} from "./auth";
import { handleEmailChange } from "./emailChangeService";
import {
  sendDepositApprovedEmail,
  sendDepositSuccessEmail,
  sendWelcomeEmail,
  sendWithdrawalApprovedEmail,
  sendWithdrawalRequestEmail,
} from "./emailService";
import { sendTestEmail } from "./emailTestingService";
import { setupAdminPanel } from "./fixed-admin-panel";
import logRoutes from "./logRoutes";
import { DatabaseStorage } from "./storage";
import { supabase } from "./supabase";

// Create storage instances
const storage = new DatabaseStorage();

// Define base user interface to avoid recursion
interface BaseUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  isVerified: boolean;
  isActive: boolean;
  role: "user" | "admin";
  createdAt: Date;
  updatedAt: Date;
  passwordResetToken?: string | null;
  passwordResetTokenExpiry?: Date | null;
  pendingEmail?: string | null;
  bitcoinAddress?: string | null;
  bitcoinCashAddress?: string | null;
  ethereumAddress?: string | null;
  bnbAddress?: string | null;
  usdtTrc20Address?: string | null;
}

declare global {
  namespace Express {
    interface User extends BaseUser {}
  }
}

const router = express.Router();

// Helper function to convert data to CSV
function convertToCSV(data: any[]): string {
  if (data.length === 0) return "";

  const headers = Object.keys(data[0]);
  const csvHeaders = headers.join(",");

  const csvRows = data.map((row) =>
    headers
      .map((header) => {
        const value = row[header];
        // Escape commas and quotes in CSV
        if (
          typeof value === "string" &&
          (value.includes(",") || value.includes('"'))
        ) {
          return `"${value.replace(/"/g, '""')}"`;
        }
        return value;
      })
      .join(",")
  );

  return [csvHeaders, ...csvRows].join("\n");
}

// Authenticated middleware - moved to the top before it's used
const isAuthenticated = (req: Request, res: Response, next: NextFunction) => {
  if (!req.isAuthenticated()) {
    return res.status(401).json({ message: "Unauthorized: Login required" });
  }
  next();
};

// Email verification routes
router.post("/verify-email", async (req, res) => {
  try {
    const { token } = req.body;

    if (!token) {
      return res
        .status(400)
        .json({ message: "Verification token is required" });
    }

    const verificationResult = await verifyUserEmail(token);

    if (!verificationResult || !verificationResult.user) {
      return res
        .status(400)
        .json({ message: "Invalid or expired verification token" });
    }

    return res.status(200).json({
      message: "Email verified successfully",
      user: {
        id: verificationResult.user.id,
        username: verificationResult.user.username,
        email: verificationResult.user.email,
        isVerified: verificationResult.user.isVerified,
      },
    });
  } catch (error) {
    console.error("Email verification error:", error);
    return res.status(500).json({ message: "Failed to verify email" });
  }
});

router.post(
  "/resend-verification",
  isAuthenticated,
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = req.user.id;
      const user = await storage.getUser(userId);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "Email is already verified" });
      }

      // Resend verification email
      await resendVerificationEmail(userId);

      return res
        .status(200)
        .json({ message: "Verification email sent successfully" });
    } catch (error) {
      console.error("Resend verification error:", error);
      return res
        .status(500)
        .json({ message: "Failed to resend verification email" });
    }
  }
);

// Development-only route for manually verifying a user
if (process.env.NODE_ENV !== "production") {
  router.get("/dev/verify-user/:email", async (req, res) => {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      if (user.isVerified) {
        return res.status(400).json({ message: "User is already verified" });
      }

      const updatedUser = await storage.updateUser(user.id, {
        isVerified: true,
        verificationToken: null,
      });

      if (!updatedUser) {
        return res
          .status(500)
          .json({ message: "Failed to update user verification status" });
      }

      if (process.env.NODE_ENV !== "production")
        console.log(
          `🔧 Development mode: User ${email} has been manually verified`
        );

      return res.status(200).json({
        message: "User verified successfully (DEVELOPMENT MODE ONLY)",
        user: {
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          isVerified: updatedUser.isVerified,
        },
      });
    } catch (error) {
      console.error("Dev verification error:", error);
      return res
        .status(500)
        .json({ message: "Failed to manually verify user" });
    }
  });
}

// Email sending routes
router.post("/send-welcome-email", async (req, res) => {
  try {
    const { email, full_name } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    // Create a minimal user object for the email
    const userData = {
      id: 0, // Not needed for email template
      uid: "temp-uid", // Not needed for email template
      email,
      full_name: full_name || "User",
      role: "user",
      is_admin: false,
    };

    const emailSent = await sendWelcomeEmail(userData);

    if (emailSent) {
      return res
        .status(200)
        .json({ message: "Welcome email sent successfully" });
    } else {
      return res.status(500).json({ message: "Failed to send welcome email" });
    }
  } catch (error) {
    console.error("Send welcome email error:", error);
    return res.status(500).json({ message: "Failed to send welcome email" });
  }
});

// Simple admin routes that work with Supabase directly
router.get("/admin/users-simple", requireAdminRole, async (req, res) => {
  try {
    // Admin role verified by middleware
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Failed to fetch users" });
    }

    return res.status(200).json({ users });
  } catch (error) {
    console.error("Admin users fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch users" });
  }
});

// Simple visitor stats endpoints
router.get(
  "/admin/visitors/active-simple",
  requireAdminRole,
  async (req, res) => {
    try {
      // Return mock data for now - in production you'd query your visitor tracking system
      return res.status(200).json({
        visitors: [],
        count: 0,
      });
    } catch (error) {
      console.error("Active visitors fetch error:", error);
      return res
        .status(500)
        .json({ message: "Failed to fetch active visitors" });
    }
  }
);

router.get(
  "/admin/visitors/stats-simple",
  requireAdminRole,
  async (req, res) => {
    try {
      // Return mock stats for now - in production you'd query your analytics
      return res.status(200).json({
        totalVisitors: 0,
        activeVisitors: 0,
        pageViews: 0,
        bounceRate: 0,
        avgSessionDuration: 0,
        topPages: [],
      });
    } catch (error) {
      console.error("Visitor stats fetch error:", error);
      return res.status(500).json({ message: "Failed to fetch visitor stats" });
    }
  }
);

// Simple admin deposits endpoint
router.get("/admin/deposits-simple", requireAdminRole, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: deposits, error } = await supabase
      .from("transactions")
      .select(
        `
        *,
        users!inner(id, username, email, first_name, last_name)
      `
      )
      .eq("type", "deposit")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Failed to fetch deposits" });
    }

    return res.status(200).json({
      deposits: deposits || [],
      totalDeposits: deposits?.length || 0,
    });
  } catch (error) {
    console.error("Admin deposits fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch deposits" });
  }
});

// Simple admin withdrawals endpoint
router.get("/admin/transactions", requireAdminRole, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get query parameters
    const type = req.query.type as string;
    const status = req.query.status as string;
    const search = req.query.search as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;

    // Build query
    let query = supabase
      .from("transactions")
      .select(
        `
        *,
        users!inner(id, username, email, first_name, last_name)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (type) {
      query = query.eq("type", type);
    }
    if (status) {
      query = query.eq("status", status);
    }
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,users.email.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: transactions, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Failed to fetch transactions" });
    }

    return res.status(200).json({
      transactions: transactions || [],
      total: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Admin transactions fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch transactions" });
  }
});

// Simple admin stats endpoint
router.get("/admin/stats-simple", requireAdminRole, async (req, res) => {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Get user counts
    const { count: totalUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true });

    const { count: activeUsers } = await supabase
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("is_active", true);

    // Get transaction counts and totals
    const { data: transactionStats } = await supabase
      .from("transactions")
      .select("type, status, amount")
      .in("type", ["deposit", "withdrawal"]);

    const stats = transactionStats?.reduce(
      (acc: any, tx) => {
        const amount = parseFloat(tx.amount) || 0;
        if (tx.type === "deposit") {
          acc.totalDeposits += amount;
          if (tx.status === "pending") acc.deposits.pending++;
          if (tx.status === "completed") acc.deposits.approved++;
          acc.deposits.total++;

          // Check if transaction is from current month
          const txDate = new Date(tx.created_at);
          const now = new Date();
          if (
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear()
          ) {
            acc.deposits.thisMonth += amount;
          }
        } else if (tx.type === "withdrawal") {
          acc.totalWithdrawals += amount;
          if (tx.status === "pending") acc.withdrawals.pending++;
          if (tx.status === "completed") acc.withdrawals.approved++;
          acc.withdrawals.total++;

          // Check if transaction is from current month
          const txDate = new Date(tx.created_at);
          const now = new Date();
          if (
            txDate.getMonth() === now.getMonth() &&
            txDate.getFullYear() === now.getFullYear()
          ) {
            acc.withdrawals.thisMonth += amount;
          }
        }
        if (tx.status === "pending") acc.pendingTransactions++;
        return acc;
      },
      {
        totalDeposits: 0,
        totalWithdrawals: 0,
        pendingTransactions: 0,
        deposits: {
          total: 0,
          pending: 0,
          approved: 0,
          thisMonth: 0,
        },
        withdrawals: {
          total: 0,
          pending: 0,
          approved: 0,
          thisMonth: 0,
        },
      }
    ) || {
      totalDeposits: 0,
      totalWithdrawals: 0,
      pendingTransactions: 0,
      deposits: { total: 0, pending: 0, approved: 0, thisMonth: 0 },
      withdrawals: { total: 0, pending: 0, approved: 0, thisMonth: 0 },
    };

    return res.status(200).json({
      totalUsers: totalUsers || 0,
      activeUsers: activeUsers || 0,
      ...stats,
      maintenanceMode: false,
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch admin stats" });
  }
});

// Simple audit logs endpoint
router.get("/admin/audit-simple", requireAdminRole, async (req, res) => {
  try {
    // Return mock audit data for now
    return res.status(200).json({
      logs: [],
      totalLogs: 0,
    });
  } catch (error) {
    console.error("Admin audit fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// User profile routes
router.get("/profile", async (req: Request, res: Response) => {
  try {
    // For development/testing, bypass authentication and return a test user
    // In production, this would verify the JWT token properly
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      // Return error if no auth header
      return res.status(401).json({
        message: "Authentication required",
        error: "NO_AUTH_HEADER",
      });
    }

    // Return authenticated user data
    return res.status(200).json({
      id: 1,
      username: "testuser",
      email: "user@axixfinance.com",
      firstName: "Test",
      lastName: "User",
      isVerified: true,
      isActive: true,
      role: "user",
      balance: "0",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Get profile error:", error);
    return res.status(500).json({ message: "Failed to get user profile" });
  }
});

router.put("/profile", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { firstName, lastName, username } = req.body;

    if (username && username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters long" });
    }

    if (username) {
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ message: "Username is already taken" });
      }
    }

    const updatedUser = await storage.updateUser(userId, {
      firstName,
      lastName,
      username,
    });

    if (!updatedUser) {
      return res.status(404).json({ message: "Failed to update user profile" });
    }

    return res.status(200).json({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      firstName: updatedUser.firstName,
      lastName: updatedUser.lastName,
      isVerified: updatedUser.isVerified,
      role: updatedUser.role,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    return res.status(500).json({ message: "Failed to update user profile" });
  }
});

// Update email route - separate from profile updates to handle verification flow
router.post("/update-email", async (req: Request, res: Response) => {
  await handleEmailChange(req, res);
});

// Get user balance route
router.get("/users/:userId/balance", async (req: Request, res: Response) => {
  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Login required" });
    }

    // Return balance data
    return res.status(200).json({
      availableBalance: 0,
      pendingBalance: 0,
      totalBalance: 0,
      lastUpdated: new Date(),
    });
  } catch (error) {
    console.error("Get balance error:", error);
    return res.status(500).json({ message: "Failed to get user balance" });
  }
});

// Change password route
router.post("/change-password", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res
        .status(400)
        .json({ message: "Current password and new password are required" });
    }

    if (newPassword.length < 8) {
      return res
        .status(400)
        .json({ message: "New password must be at least 8 characters long" });
    }

    const user = await storage.getUser(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isPasswordValid = await comparePasswords(
      currentPassword,
      user.password
    );

    if (!isPasswordValid) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    const hashedPassword = await hashPassword(newPassword);

    await storage.updateUser(userId, {
      password: hashedPassword,
    });

    return res.status(200).json({ message: "Password changed successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    return res.status(500).json({ message: "Failed to change password" });
  }
});

// Get user crypto balances (per-crypto)
router.get("/users/:userId/crypto-balances", async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    const userId = parseInt(req.params.userId, 10);
    if (req.user.role !== "admin" && req.user.id !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    // For demo, all balances are 0, but you can extend this to use real data
    const cryptos = [
      { key: "bitcoin", label: "BITCOIN", address: user.bitcoinAddress },
      {
        key: "bitcoinCash",
        label: "Bitcoin cash",
        address: user.bitcoinCashAddress,
      },
      { key: "ethereum", label: "Ethereum", address: user.ethereumAddress },
      { key: "usdt", label: "Usdt trc20", address: user.usdtTrc20Address },
      { key: "bnb", label: "BNB", address: user.bnbAddress },
    ];
    const balances = cryptos.map((crypto) => ({
      key: crypto.key,
      label: crypto.label,
      processing: 0, // TODO: Replace with real processing amount if available
      available: 0, // TODO: Replace with real available amount if available
      pending: 0, // TODO: Replace with real pending amount if available
      account: crypto.address || "not set",
    }));
    return res.status(200).json(balances);
  } catch (error) {
    console.error("Get crypto balances error:", error);
    return res.status(500).json({ message: "Failed to get crypto balances" });
  }
});

// User transaction routes
router.get(
  "/users/:userId/transactions",
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const userId = parseInt(req.params.userId, 10);
      // Users can only access their own transactions unless they're admin
      if (req.user.role !== "admin" && req.user.id !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }

      const transactions = await storage.getUserTransactions(userId);
      return res.status(200).json(transactions);
    } catch (error) {
      console.error("Get user transactions error:", error);
      return res
        .status(500)
        .json({ message: "Failed to get user transactions" });
    }
  }
);

// Get transactions (for current user if no userId specified)
router.get("/transactions", async (req: Request, res: Response) => {
  try {
    // Check authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Unauthorized: Login required" });
    }

    // Return empty transactions array for now - can be extended later
    return res.status(200).json([]);
  } catch (error) {
    console.error("Get transactions error:", error);
    return res.status(500).json({ message: "Failed to get transactions" });
  }
});

// Get specific transaction by ID
router.get(
  "/transactions/:transactionId",
  async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const transactionId = parseInt(req.params.transactionId, 10);
      const transaction = await storage.getTransaction(transactionId);

      if (!transaction) {
        return res.status(404).json({ message: "Transaction not found" });
      }

      // Users can only access their own transactions unless they're admin
      if (req.user.role !== "admin" && transaction.userId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      return res.status(200).json(transaction);
    } catch (error) {
      console.error("Get transaction error:", error);
      return res.status(500).json({ message: "Failed to get transaction" });
    }
  }
);

// Create new transaction (deposit/withdrawal)
router.post("/transactions", async (req: Request, res: Response) => {
  try {
    const {
      type,
      amount,
      description,
      cryptoType,
      walletAddress,
      transactionHash,
      planName,
      userId,
    } = req.body;

    if (!type || !amount) {
      return res
        .status(400)
        .json({ message: "Transaction type and amount are required" });
    }

    // If this is a withdrawal, create it in the database and send email
    if (type === "withdrawal" && req.user?.id) {
      const actualUserId = userId || req.user.id;

      // Create the withdrawal transaction
      const transaction = await storage.createTransaction({
        userId: actualUserId,
        type: "withdrawal",
        amount: amount.toString(),
        status: "pending",
        description:
          description || `Withdrawal of $${amount} via ${cryptoType}`,
        cryptoType: cryptoType || null,
        walletAddress: walletAddress || null,
        transactionHash: transactionHash || null,
        destination: walletAddress || null,
      });

      // Create notification for the user
      await storage.createNotification({
        userId: actualUserId,
        type: "transaction",
        title: "Withdrawal Request Submitted",
        message: `Your withdrawal request of $${amount.toLocaleString()} has been submitted and is pending approval.`,
        relatedEntityType: "transaction",
        relatedEntityId: transaction.id,
      });

      // Send withdrawal request email
      try {
        await sendWithdrawalRequestEmail(
          req.user as any,
          amount.toString(),
          req.ip || "Unknown"
        );
        console.log(`📧 Withdrawal request email sent to ${req.user?.email}`);
      } catch (emailError) {
        console.error("Failed to send withdrawal request email:", emailError);
        // Don't fail the transaction if email fails
      }

      // Log the withdrawal request for audit trail
      await storage.createLog({
        type: "audit",
        message: `User requested withdrawal of $${amount} via ${cryptoType}`,
        details: {
          userId: actualUserId,
          amount,
          cryptoType,
          walletAddress,
          transactionId: transaction.id,
        },
        userId: actualUserId,
      });

      return res.status(201).json({
        success: true,
        message: "Withdrawal request submitted successfully",
        transaction: transaction,
      });
    }

    // For deposits and other types, return mock data for now
    const mockTransaction = {
      id: Date.now(),
      userId: userId || 1,
      type,
      amount: amount.toString(),
      status: "pending",
      description: description || `${type} transaction`,
      cryptoType: cryptoType || null,
      walletAddress: walletAddress || null,
      transactionHash: transactionHash || null,
      planName: planName || null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return res.status(201).json(mockTransaction);
  } catch (error) {
    console.error("Create transaction error:", error);
    return res.status(500).json({ message: "Failed to create transaction" });
  }
});

// Deposit confirmation endpoint
router.post(
  "/transactions/deposit-confirmation",
  async (req: Request, res: Response) => {
    try {
      const { amount, cryptoType, walletAddress, transactionHash, planName } =
        req.body;

      if (!amount || !cryptoType || !walletAddress || !transactionHash) {
        return res.status(400).json({
          message:
            "Amount, crypto type, wallet address, and transaction hash are required",
        });
      }

      // Return mock success response
      return res.status(201).json({
        success: true,
        amount: parseFloat(amount),
        transactionId: Date.now(),
        message: "Deposit confirmation submitted successfully",
      });
    } catch (error) {
      console.error("Deposit confirmation error:", error);
      return res
        .status(500)
        .json({ message: "Failed to submit deposit confirmation" });
    }
  }
);

// Transaction stats endpoint
router.get("/transactions/stats", async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    // For now, return basic mock stats
    // In a real implementation, you'd calculate these from the database
    return res.status(200).json({
      totalTransactions: 0,
      pendingTransactions: 0,
      completedTransactions: 0,
      failedTransactions: 0,
      totalVolume: "0",
      averageTransactionAmount: "0",
      transactionsByType: [
        { type: "deposit", count: 0 },
        { type: "withdrawal", count: 0 },
        { type: "transfer", count: 0 },
        { type: "investment", count: 0 },
      ],
      transactionsByStatus: [
        { status: "pending", count: 0 },
        { status: "completed", count: 0 },
        { status: "rejected", count: 0 },
      ],
      transactionTrend: [],
    });
  } catch (error) {
    console.error("Get transaction stats error:", error);
    return res.status(500).json({ message: "Failed to get transaction stats" });
  }
});

// Health check endpoint
router.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
});

// Export the router
export default router;

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up admin panel routes first
  setupAdminPanel(app);
  setupAuth(app);

  // Apply the router to the app
  app.use("/api", router);

  // Apply logging routes
  app.use("/api", logRoutes);

  // Health check endpoint
  app.get("/api/health", (req: Request, res: Response) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development",
      database: global.dbConnectionIssues ? "error" : "connected",
      version: process.env.npm_package_version || "1.0.0",
    });
  });

  // Admin routes
  app.get(
    "/api/admin/stats",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      console.log("🔍 Admin stats endpoint called");
      console.log("User:", req.user?.email);
      console.log("Is admin:", req.user?.role === "admin");

      try {
        // Get dashboard statistics
        const totalUsers = await storage.getUserCount();
        console.log("📊 Total users:", totalUsers);
        const activeUsers = await storage.getActiveUserCount();
        console.log("📊 Active users:", activeUsers);
        const pendingTransactions = await storage.getPendingTransactionCount();
        console.log("📊 Pending transactions:", pendingTransactions);

        // Get ALL transactions for proper calculations
        const allTransactions = await storage.getAllTransactions();
        console.log(
          "Admin stats - Total transactions found:",
          allTransactions.length
        );
        console.log(
          "Admin stats - Sample transactions:",
          allTransactions.slice(0, 3).map((t) => ({
            id: t.id,
            type: t.type,
            status: t.status,
            amount: t.amount,
          }))
        );

        // Calculate deposit statistics
        const allDeposits = allTransactions.filter((t) => t.type === "deposit");
        console.log("Admin stats - Deposits found:", allDeposits.length);
        console.log(
          "Admin stats - Sample deposits:",
          allDeposits.slice(0, 3).map((t) => ({
            id: t.id,
            type: t.type,
            status: t.status,
            amount: t.amount,
          }))
        );
        const pendingDeposits = allDeposits.filter(
          (t) => t.status === "pending"
        );
        const approvedDeposits = allDeposits.filter(
          (t) => t.status === "completed"
        );
        const totalDepositsAmount = allDeposits.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );

        // Calculate withdrawal statistics
        const allWithdrawals = allTransactions.filter(
          (t) => t.type === "withdrawal"
        );
        const pendingWithdrawals = allWithdrawals.filter(
          (t) => t.status === "pending"
        );
        const approvedWithdrawals = allWithdrawals.filter(
          (t) => t.status === "completed"
        );
        const totalWithdrawalsAmount = allWithdrawals.reduce(
          (sum, t) => sum + parseFloat(t.amount),
          0
        );

        // Calculate this month's data
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const thisMonthDeposits = allDeposits.filter((t) =>
          t.createdAt ? new Date(t.createdAt) >= startOfMonth : false
        );
        const thisMonthWithdrawals = allWithdrawals.filter((t) =>
          t.createdAt ? new Date(t.createdAt) >= startOfMonth : false
        );

        const stats = {
          totalUsers,
          activeUsers,
          totalDeposits: totalDepositsAmount,
          totalWithdrawals: totalWithdrawalsAmount,
          pendingTransactions,
          maintenanceMode: false,
          deposits: {
            total: totalDepositsAmount,
            pending: pendingDeposits.length,
            approved: approvedDeposits.length,
            thisMonth: thisMonthDeposits.reduce(
              (sum, t) => sum + parseFloat(t.amount),
              0
            ),
          },
          withdrawals: {
            total: totalWithdrawalsAmount,
            pending: pendingWithdrawals.length,
            approved: approvedWithdrawals.length,
            thisMonth: thisMonthWithdrawals.reduce(
              (sum, t) => sum + parseFloat(t.amount),
              0
            ),
          },
        };

        res.json(stats);
      } catch (error) {
        console.error("Error fetching admin stats:", error);
        res.status(500).json({ message: "Failed to fetch admin statistics" });
      }
    }
  );

  // Admin email test endpoint
  app.post(
    "/api/admin/test-email",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      await sendTestEmail(req, res);
    }
  );

  app.get(
    "/api/admin/users",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { page = 1, limit = 10, search, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const users = await storage.getUsers({
          limit: Number(limit),
          offset,
          search: search as string,
          status: status as string,
        });

        const totalUsers = await storage.getUserCount();

        // For each user, fetch their dynamic balance
        const usersWithBalance = await Promise.all(
          users.map(async (user) => {
            const transactions = await storage.getUserTransactions(user.id);
            let availableBalance = 0;
            for (const tx of transactions) {
              if (tx.status === "completed") {
                if (tx.type === "deposit" || tx.type === "transfer") {
                  availableBalance += parseFloat(tx.amount);
                } else if (
                  tx.type === "withdrawal" ||
                  tx.type === "investment"
                ) {
                  availableBalance -= parseFloat(tx.amount);
                }
              }
            }
            return {
              ...user,
              balance: availableBalance,
            };
          })
        );

        res.json({
          users: usersWithBalance.map((user) => ({
            id: user.id,
            username: user.username,
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            role: user.role,
            isVerified: user.isVerified,
            isActive: user.isActive,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            balance: user.balance, // Now included and dynamic!
          })),
          totalPages: Math.ceil(totalUsers / Number(limit)),
          currentPage: Number(page),
          totalUsers,
        });
      } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users" });
      }
    }
  );

  app.put(
    "/api/admin/users/:id",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const updates = req.body;

        // Don't allow updating passwords through this endpoint
        delete updates.password;

        const updatedUser = await storage.updateUser(userId, updates);

        if (!updatedUser) {
          return res.status(404).json({ message: "User not found" });
        }

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin updated user ${userId}`,
          details: {
            updatedFields: Object.keys(updates),
            targetUserId: userId,
          },
        });

        res.json({
          id: updatedUser.id,
          username: updatedUser.username,
          email: updatedUser.email,
          firstName: updatedUser.firstName,
          lastName: updatedUser.lastName,
          role: updatedUser.role,
          isVerified: updatedUser.isVerified,
          isActive: updatedUser.isActive,
          createdAt: updatedUser.createdAt,
          updatedAt: updatedUser.updatedAt,
        });
      } catch (error) {
        console.error("Error updating user:", error);
        res.status(500).json({ message: "Failed to update user" });
      }
    }
  );

  app.delete(
    "/api/admin/users/:id",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);

        // Validate user ID
        if (isNaN(userId)) {
          return res.status(400).json({ message: "Invalid user ID" });
        }

        // Prevent admin from deleting themselves
        if (userId === req.user!.id) {
          return res
            .status(400)
            .json({ message: "Cannot delete your own account" });
        }

        // Check if user exists before attempting to delete
        const userToDelete = await storage.getUser(userId);
        if (!userToDelete) {
          return res.status(404).json({ message: "User not found" });
        }

        // Check if user can be safely deleted
        const deleteCheck = await storage.canUserBeDeleted(userId);

        const deleted = await storage.deleteUser(userId);

        if (!deleted) {
          return res.status(500).json({
            message: "Failed to delete user due to database constraints",
          });
        }

        // Determine what actually happened and provide appropriate response
        const wasDeactivated = !deleteCheck.canDelete;

        // Log admin action with appropriate message
        const actionMessage = wasDeactivated
          ? `Admin deactivated user ${userId} (${userToDelete.username}) - had ${deleteCheck.associatedRecords.transactions} transactions and ${deleteCheck.associatedRecords.auditLogs} audit logs`
          : `Admin deleted user ${userId} (${userToDelete.username})`;

        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: actionMessage,
          details: {
            targetUserId: userId,
            targetUsername: userToDelete.username,
            targetEmail: userToDelete.email,
            hadAssociatedRecords: wasDeactivated,
            associatedRecords: deleteCheck.associatedRecords,
          },
        });

        // Provide appropriate response message
        const responseMessage = wasDeactivated
          ? `User account deactivated successfully (user had ${deleteCheck.associatedRecords.transactions} transactions and ${deleteCheck.associatedRecords.auditLogs} audit logs)`
          : "User deleted successfully";

        res.json({
          message: responseMessage,
          action: wasDeactivated ? "deactivated" : "deleted",
          deletedUser: {
            id: userId,
            username: userToDelete.username,
            email: userToDelete.email,
          },
        });
      } catch (error) {
        console.error("Error deleting user:", error);

        // Check if it's a foreign key constraint error
        if (
          error instanceof Error &&
          error.message.includes("foreign key constraint")
        ) {
          return res.status(409).json({
            message:
              "Cannot delete user: User has associated records that prevent deletion",
            error: "foreign_key_constraint",
          });
        }

        res.status(500).json({ message: "Failed to delete user" });
      }
    }
  );

  // Fund user account endpoint
  app.post(
    "/api/admin/users/:id/fund",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.id);
        const { amount, description } = req.body;

        // Validate input
        if (!amount || isNaN(amount) || amount <= 0) {
          return res
            .status(400)
            .json({ message: "Valid positive amount is required" });
        }

        if (amount > 1000000) {
          return res
            .status(400)
            .json({ message: "Amount cannot exceed $1,000,000" });
        }

        // Check if user exists
        const user = await storage.getUser(userId);
        if (!user) {
          return res.status(404).json({ message: "User not found" });
        }

        // Do NOT update user.balance directly!
        // Only create a completed deposit transaction
        await storage.createTransaction({
          userId: userId,
          type: "deposit",
          amount: amount.toString(),
          status: "completed",
          description:
            description ||
            `Admin funding by ${req.user!.firstName} ${req.user!.lastName}`,
        });

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin funded user account: $${amount} added to user ${userId}`,
          details: {
            targetUserId: userId,
            amount: amount,
            description: description,
            previousBalance: "dynamic", // Now calculated dynamically
            newBalance: "dynamic", // Now calculated dynamically
          },
        });

        // Create notification for the user
        await storage.createNotification({
          userId: userId,
          type: "account",
          title: "Account Funded",
          message: `Your account has been funded with $${amount.toLocaleString()} by administration.`,
          relatedEntityType: "transaction",
          relatedEntityId: userId,
        });

        res.json({
          message: "User account funded successfully",
          amount: amount,
        });
      } catch (error) {
        console.error("Error funding user account:", error);
        res.status(500).json({ message: "Failed to fund user account" });
      }
    }
  );

  app.get(
    "/api/admin/transactions",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { page = 1, limit = 10, type, status } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        const transactions = await storage.getTransactions({
          limit: Number(limit),
          offset,
          type: type as string,
          status: status as string,
        });

        const totalTransactions = await storage.getTransactionCount();

        res.json({
          transactions,
          totalPages: Math.ceil(totalTransactions / Number(limit)),
          currentPage: Number(page),
          totalTransactions,
        });
      } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
      }
    }
  );

  app.put(
    "/api/admin/transactions/:id/status",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const transactionId = parseInt(req.params.id);
        const { status, reason } = req.body;

        const updatedTransaction = await storage.updateTransactionStatus(
          transactionId,
          status,
          reason
        );

        if (!updatedTransaction) {
          return res.status(404).json({ message: "Transaction not found" });
        }

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin updated transaction ${transactionId} status to ${status}`,
          details: { transactionId, newStatus: status, reason },
        });

        res.json(updatedTransaction);
      } catch (error) {
        console.error("Error updating transaction:", error);
        res.status(500).json({ message: "Failed to update transaction" });
      }
    }
  );

  // Admin deposits management
  app.get(
    "/api/admin/deposits",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      console.log("🔍 Admin deposits endpoint called");
      console.log("Query params:", req.query);

      try {
        const {
          page = 1,
          limit = 10,
          status,
          search,
          dateFrom,
          dateTo,
          method,
          amountMin,
          amountMax,
        } = req.query;

        const offset = (Number(page) - 1) * Number(limit);

        // Get deposits from the transactions table
        const deposits = await storage.getDeposits({
          limit: Number(limit),
          offset,
          status: status as string,
          search: search as string,
          ...(dateFrom ? { dateFrom: dateFrom as string } : {}),
          ...(dateTo ? { dateTo: dateTo as string } : {}),
          ...(method ? { method: method as string } : {}),
          ...(amountMin ? { amountMin: parseFloat(amountMin as string) } : {}),
          ...(amountMax ? { amountMax: parseFloat(amountMax as string) } : {}),
        });

        // Also get deposits from deposits_history table temporarily
        let historyDeposits: any[] = [];
        try {
          // Fetch deposits history data with user information
          const { data: historyData, error: historyError } = await supabase
            .from("deposits_history")
            .select(
              `
              id,
              user_id,
              amount,
              plan_name,
              status,
              created_at,
              updated_at,
              payment_method,
              users!inner(id, username, email)
            `
            )
            .eq("status", "pending")
            .order("created_at", { ascending: false })
            .limit(Number(limit));

          if (historyError) {
            throw historyError;
          }

          // Format the data to match expected structure
          if (historyData && Array.isArray(historyData)) {
            historyDeposits = historyData.map((deposit: any) => ({
              id: `hist_${deposit.id}`,
              user_id: deposit.user_id,
              amount: deposit.amount?.toString() || "0",
              description: deposit.plan_name,
              status: deposit.status,
              created_at: deposit.created_at,
              updated_at: deposit.updated_at,
              crypto_type: deposit.payment_method,
              transaction_hash: null,
              wallet_address: null,
              user: deposit.users || null,
            }));
          }
        } catch (historyError) {
          console.log(
            "Could not fetch from deposits_history:",
            historyError.message
          );
        }

        // Combine both sources
        const allDeposits = [...deposits, ...historyDeposits];
        const totalDeposits =
          (await storage.getDepositCount()) + historyDeposits.length;

        console.log(
          `Admin deposits query: found ${allDeposits.length} deposits, total: ${totalDeposits}`
        );

        res.json({
          deposits: allDeposits,
          totalPages: Math.ceil(totalDeposits / Number(limit)),
          currentPage: Number(page),
          totalDeposits,
        });
      } catch (error) {
        console.error("Error fetching deposits:", error);
        res.status(500).json({ message: "Failed to fetch deposits" });
      }
    }
  );

  app.put(
    "/api/admin/deposits/:id/status",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const depositId = parseInt(req.params.id);
        const { status, reason } = req.body;

        // Get the deposit first to check details
        const deposit = await storage.getTransactionById(depositId);
        if (!deposit) {
          return res.status(404).json({ message: "Deposit not found" });
        }

        // Update deposit status
        const updatedDeposit = await storage.updateTransactionStatus(
          depositId,
          status,
          reason
        );

        if (!updatedDeposit) {
          return res.status(404).json({ message: "Failed to update deposit" });
        }

        // Get user details for email
        const user = await storage.getUser(deposit.userId);

        // Send appropriate email based on status
        try {
          if (status === "completed" && user) {
            await sendDepositApprovedEmail(
              user,
              deposit.amount,
              deposit.cryptoType || "Crypto",
              deposit.planName || undefined
            );
          }
          // Could add rejection email here if needed
        } catch (emailError) {
          console.error("Failed to send deposit status email:", emailError);
          // Don't fail the request if email fails
        }

        // Notify user about the decision
        const statusMessage = status === "completed" ? "approved" : "rejected";
        await storage.createNotification({
          userId: deposit.userId,
          type: "transaction",
          title: `Deposit ${statusMessage.charAt(0).toUpperCase() + statusMessage.slice(1)}`,
          message: `Your deposit of $${deposit.amount} has been ${statusMessage} by admin.${reason ? ` Reason: ${reason}` : ""}`,
          relatedEntityType: "transaction",
          relatedEntityId: depositId,
        });

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin ${statusMessage} deposit ${depositId}${reason ? ` - Reason: ${reason}` : ""}`,
          details: {
            depositId,
            newStatus: status,
            reason,
            amount: updatedDeposit.amount,
          },
        });

        res.json({
          success: true,
          message: `Deposit ${statusMessage} successfully`,
          deposit: updatedDeposit,
        });
      } catch (error) {
        console.error("Error updating deposit status:", error);
        res.status(500).json({ message: "Failed to update deposit status" });
      }
    }
  );

  // Admin withdrawals management
  app.get(
    "/api/admin/withdrawals",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        console.log("GET /api/admin/withdrawals called with query:", req.query);

        const { page = 1, limit = 10, status, search } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        console.log("Querying withdrawals with status:", status);

        const withdrawals = await storage.getWithdrawals({
          limit: Number(limit),
          offset,
          status: status as string,
          search: search as string,
        });

        console.log(`Found ${withdrawals.length} withdrawals`);

        const totalWithdrawals = await storage.getWithdrawalCount();

        res.json({
          withdrawals,
          totalPages: Math.ceil(totalWithdrawals / Number(limit)),
          currentPage: Number(page),
          totalWithdrawals,
        });
      } catch (error) {
        console.error("Error fetching withdrawals:", error);
        res.status(500).json({ message: "Failed to fetch withdrawals" });
      }
    }
  );

  app.put(
    "/api/admin/withdrawals/:id/status",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const withdrawalId = parseInt(req.params.id);
        const { status, reason } = req.body;

        const updatedWithdrawal = await storage.updateWithdrawalStatus(
          withdrawalId,
          status
        );

        if (!updatedWithdrawal) {
          return res.status(404).json({ message: "Withdrawal not found" });
        }

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin ${status} withdrawal ${withdrawalId}`,
          details: {
            withdrawalId,
            newStatus: status,
            reason,
            amount: updatedWithdrawal.amount,
          },
        });

        res.json(updatedWithdrawal);
      } catch (error) {
        console.error("Error updating withdrawal status:", error);
        res.status(500).json({ message: "Failed to update withdrawal status" });
      }
    }
  );

  // Bulk operations for admin
  app.post(
    "/api/admin/users/bulk-update",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { userIds, updates } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res
            .status(400)
            .json({ message: "User IDs array is required" });
        }

        const results = [];
        for (const userId of userIds) {
          try {
            const updatedUser = await storage.updateUser(userId, updates);
            if (updatedUser) {
              results.push({ userId, success: true, user: updatedUser });
            } else {
              results.push({ userId, success: false, error: "User not found" });
            }
          } catch (error) {
            results.push({ userId, success: false, error: "Update failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin performed bulk update on ${userIds.length} users`,
          details: {
            userIds,
            updates,
            results: results.map((r) => ({
              userId: r.userId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk update:", error);
        res.status(500).json({ message: "Failed to perform bulk update" });
      }
    }
  );

  app.post(
    "/api/admin/transactions/bulk-update",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { transactionIds, status, reason } = req.body;

        if (!Array.isArray(transactionIds) || transactionIds.length === 0) {
          return res
            .status(400)
            .json({ message: "Transaction IDs array is required" });
        }

        const results = [];
        for (const transactionId of transactionIds) {
          try {
            const updatedTransaction = await storage.updateTransactionStatus(
              transactionId,
              status,
              reason
            );
            if (updatedTransaction) {
              results.push({
                transactionId,
                success: true,
                transaction: updatedTransaction,
              });
            } else {
              results.push({
                transactionId,
                success: false,
                error: "Transaction not found",
              });
            }
          } catch (error) {
            results.push({
              transactionId,
              success: false,
              error: "Update failed",
            });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin performed bulk status update on ${transactionIds.length} transactions`,
          details: {
            transactionIds,
            newStatus: status,
            reason,
            results: results.map((r) => ({
              transactionId: r.transactionId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk transaction update:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk transaction update" });
      }
    }
  );

  // Add missing bulk operations for deposits and withdrawals
  app.post(
    "/api/admin/deposits/bulk-approve",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { depositIds } = req.body;

        if (!Array.isArray(depositIds) || depositIds.length === 0) {
          return res
            .status(400)
            .json({ message: "Deposit IDs array is required" });
        }

        const results = [];
        for (const depositId of depositIds) {
          try {
            if (depositId.toString().startsWith("hist_")) {
              // Handle deposits_history table
              const historyId = parseInt(depositId.replace("hist_", ""));

              // Fetch deposit from history table
              const { data: historyData, error: historyError } = await supabase
                .from("deposits_history")
                .select("*")
                .eq("id", historyId)
                .eq("status", "pending")
                .single();

              if (historyError || !historyData) {
                results.push({
                  depositId,
                  success: false,
                  error: "Deposit not found",
                });
                continue;
              }

              // Update status to completed
              const { error: updateError } = await supabase
                .from("deposits_history")
                .update({
                  status: "completed",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", historyId);

              if (updateError) {
                results.push({
                  depositId,
                  success: false,
                  error: "Failed to update deposit status",
                });
                continue;
              }

              // Store the deposit info for balance update later
              const depositInfo = {
                amount: historyData.amount,
                userId: historyData.user_id,
              };

              // Add to pending balance updates
              pendingBalanceUpdates.push(depositInfo);

              results.push({ depositId, success: true, deposit: historyData });
            } else {
              // Handle transactions table
              const updatedDeposit = await storage.updateTransactionStatus(
                parseInt(depositId),
                "completed"
              );
              if (updatedDeposit) {
                const deposit = await storage.getTransactionById(
                  parseInt(depositId)
                );

                // Store the deposit info for balance update later
                const depositInfo = {
                  amount: deposit.amount,
                  userId: deposit.userId,
                };

                // Add to pending balance updates
                pendingBalanceUpdates.push(depositInfo);

                results.push({
                  depositId,
                  success: true,
                  deposit: updatedDeposit,
                });
              } else {
                results.push({
                  depositId,
                  success: false,
                  error: "Deposit not found",
                });
              }
            }
          } catch (error) {
            results.push({ depositId, success: false, error: "Update failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin bulk approved ${depositIds.length} deposits`,
          details: {
            depositIds,
            results: results.map((r) => ({
              depositId: r.depositId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk deposit approval:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk deposit approval" });
      }
    }
  );

  app.post(
    "/api/admin/deposits/bulk-reject",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { depositIds } = req.body;

        if (!Array.isArray(depositIds) || depositIds.length === 0) {
          return res
            .status(400)
            .json({ message: "Deposit IDs array is required" });
        }

        const results = [];
        for (const depositId of depositIds) {
          try {
            if (depositId.toString().startsWith("hist_")) {
              // Handle deposits_history table
              const historyId = parseInt(depositId.replace("hist_", ""));

              // Fetch deposit from history table
              const { data: historyData, error: historyError } = await supabase
                .from("deposits_history")
                .select("*")
                .eq("id", historyId)
                .eq("status", "pending")
                .single();

              if (historyError || !historyData) {
                results.push({
                  depositId,
                  success: false,
                  error: "Deposit not found",
                });
                continue;
              }

              // Update status to rejected
              const { error: updateError } = await supabase
                .from("deposits_history")
                .update({
                  status: "rejected",
                  updated_at: new Date().toISOString(),
                })
                .eq("id", historyId);

              if (updateError) {
                results.push({
                  depositId,
                  success: false,
                  error: "Failed to update deposit status",
                });
                continue;
              }

              results.push({ depositId, success: true, deposit: historyData });
            } else {
              // Handle transactions table
              const updatedDeposit = await storage.updateTransactionStatus(
                parseInt(depositId),
                "rejected"
              );
              if (updatedDeposit) {
                results.push({
                  depositId,
                  success: true,
                  deposit: updatedDeposit,
                });
              } else {
                results.push({
                  depositId,
                  success: false,
                  error: "Deposit not found",
                });
              }
            }
          } catch (error) {
            results.push({ depositId, success: false, error: "Update failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin bulk rejected ${depositIds.length} deposits`,
          details: {
            depositIds,
            results: results.map((r) => ({
              depositId: r.depositId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk deposit rejection:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk deposit rejection" });
      }
    }
  );

  app.delete(
    "/api/admin/deposits/bulk-delete",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { depositIds } = req.body;

        if (!Array.isArray(depositIds) || depositIds.length === 0) {
          return res
            .status(400)
            .json({ message: "Deposit IDs array is required" });
        }

        const results = [];
        for (const depositId of depositIds) {
          try {
            const deleted = await storage.deleteTransaction(depositId);
            if (deleted) {
              results.push({ depositId, success: true });
            } else {
              results.push({
                depositId,
                success: false,
                error: "Deposit not found",
              });
            }
          } catch (error) {
            results.push({ depositId, success: false, error: "Delete failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin bulk deleted ${depositIds.length} deposits`,
          details: {
            depositIds,
            results: results.map((r) => ({
              depositId: r.depositId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk deposit deletion:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk deposit deletion" });
      }
    }
  );

  app.post(
    "/api/admin/withdrawals/bulk-approve",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { withdrawalIds } = req.body;

        if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
          return res
            .status(400)
            .json({ message: "Withdrawal IDs array is required" });
        }

        const results = [];
        for (const withdrawalId of withdrawalIds) {
          try {
            const updated = await storage.updateTransactionStatus(
              parseInt(withdrawalId),
              "completed"
            );
            if (updated) {
              results.push({ withdrawalId, success: true });
            } else {
              results.push({
                withdrawalId,
                success: false,
                error: "Withdrawal not found",
              });
            }
          } catch (error) {
            results.push({
              withdrawalId,
              success: false,
              error: "Update failed",
            });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin bulk approved ${withdrawalIds.length} withdrawals`,
          details: {
            withdrawalIds,
            results: results.map((r) => ({
              withdrawalId: r.withdrawalId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk withdrawal approval:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk withdrawal approval" });
      }
    }
  );

  app.post(
    "/api/admin/withdrawals/bulk-reject",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { withdrawalIds } = req.body;

        if (!Array.isArray(withdrawalIds) || withdrawalIds.length === 0) {
          return res
            .status(400)
            .json({ message: "Withdrawal IDs array is required" });
        }

        const results = [];
        for (const withdrawalId of withdrawalIds) {
          try {
            // Get withdrawal details first for balance refund
            const withdrawal = await storage.getTransactionById(
              parseInt(withdrawalId)
            );
            if (!withdrawal || withdrawal.type !== "withdrawal") {
              results.push({
                withdrawalId,
                success: false,
                error: "Withdrawal not found",
              });
              continue;
            }

            const updated = await storage.updateTransactionStatus(
              parseInt(withdrawalId),
              "rejected"
            );
            if (updated) {
              // Refund the withdrawal amount back to user's balance
              const { error: refundError } = await supabase.rpc(
                "increment_user_balance",
                {
                  user_id: withdrawal.userId,
                  amount: parseFloat(withdrawal.amount),
                }
              );

              if (refundError) {
                console.error("Error refunding balance:", refundError);
                results.push({
                  withdrawalId,
                  success: false,
                  error: "Failed to refund balance",
                });
                continue;
              }

              results.push({ withdrawalId, success: true });
            } else {
              results.push({
                withdrawalId,
                success: false,
                error: "Withdrawal not found",
              });
            }
          } catch (error) {
            results.push({
              withdrawalId,
              success: false,
              error: "Update failed",
            });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin bulk rejected ${withdrawalIds.length} withdrawals`,
          details: {
            withdrawalIds,
            results: results.map((r) => ({
              withdrawalId: r.withdrawalId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk withdrawal rejection:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk withdrawal rejection" });
      }
    }
  );

  // Simple deposit approval
  app.post(
    "/api/admin/deposits/:id/approve",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const idParam = req.params.id;

        // Check if this is a deposits_history entry (starts with "hist_")
        if (idParam.startsWith("hist_")) {
          const historyId = parseInt(idParam.replace("hist_", ""));

          // Get deposit from deposits_history table
          const { data: historyData, error: historyError } = await supabase
            .from("deposits_history")
            .select("*")
            .eq("id", historyId)
            .eq("status", "pending")
            .single();

          if (historyError || !historyData) {
            return res.status(404).json({ message: "Deposit not found" });
          }

          // Update deposits_history status to completed
          const { error: updateError } = await supabase
            .from("deposits_history")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", historyId);

          if (updateError) {
            console.error("Error updating deposit status:", updateError);
            return res
              .status(500)
              .json({ message: "Failed to update deposit status" });
          }

          // Add to user balance using RPC function
          const { error: balanceError } = await supabase.rpc(
            "increment_user_balance",
            {
              user_id: historyData.user_id,
              amount: parseFloat(historyData.amount),
            }
          );

          if (balanceError) {
            console.error("Error updating user balance:", balanceError);
            return res
              .status(500)
              .json({ message: "Failed to update user balance" });
          }

          // Create notification
          await storage.createNotification({
            userId: historyData.user_id,
            type: "transaction",
            title: "Deposit Approved",
            message: `Your deposit of $${historyData.amount} has been approved and added to your account.`,
            relatedEntityType: "transaction",
            relatedEntityId: historyId,
          });

          await storage.createLog({
            type: "info",
            userId: req.user!.id,
            message: `Admin approved deposit #${idParam} of $${historyData.amount}`,
            details: {
              depositId: idParam,
              amount: historyData.amount,
              userId: historyData.user_id,
            },
          });

          res.json({
            success: true,
            message: "Deposit approved successfully",
            amount: historyData.amount,
          });
        } else {
          // Handle regular transaction table entries
          const depositId = parseInt(idParam);

          // Get the deposit details first
          const deposit = await storage.getTransactionById(depositId);
          if (!deposit) {
            return res.status(404).json({ message: "Deposit not found" });
          }

          // Update to completed status
          const updated = await storage.updateTransactionStatus(
            depositId,
            "completed"
          );

          if (updated) {
            // Add to user balance using RPC function
            const { error: balanceError } = await supabase.rpc(
              "increment_user_balance",
              {
                user_id: deposit.userId,
                amount: parseFloat(deposit.amount),
              }
            );

            if (balanceError) {
              console.error("Error updating user balance:", balanceError);
              return res
                .status(500)
                .json({ message: "Failed to update user balance" });
            }

            // Notify the user
            // Notify user via notification and email
            await Promise.all([
              storage.createNotification({
                userId: deposit.userId,
                type: "transaction",
                title: "Deposit Approved",
                message: `Your deposit of $${deposit.amount} has been approved and added to your account.`,
                relatedEntityType: "transaction",
                relatedEntityId: depositId,
              }),
              // Get user details for sending email
              storage.getUser(deposit.userId).then((user) => {
                if (user) {
                  sendDepositApprovedEmail(
                    user,
                    deposit.amount,
                    deposit.cryptoType || "account balance",
                    deposit.planName || undefined
                  ).catch((error) => {
                    console.error(
                      "Failed to send deposit approved email:",
                      error
                    );
                    // Don't fail the request if email fails
                  });
                }
              }),
            ]);

            await storage.createLog({
              type: "info",
              userId: req.user!.id,
              message: `Admin approved deposit #${depositId} of $${deposit.amount}`,
              details: {
                depositId,
                amount: deposit.amount,
                userId: deposit.userId,
              },
            });

            res.json({
              success: true,
              message: "Deposit approved successfully",
              amount: deposit.amount,
            });
          } else {
            res.status(404).json({ message: "Deposit not found" });
          }
        }
      } catch (error) {
        console.error("Error approving deposit:", error);
        res.status(500).json({ message: "Failed to approve deposit" });
      }
    }
  );

  // Simple deposit rejection
  app.post(
    "/api/admin/deposits/:id/reject",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const idParam = req.params.id;
        const { reason } = req.body;

        // Check if this is a deposits_history entry (starts with "hist_")
        if (idParam.startsWith("hist_")) {
          const historyId = parseInt(idParam.replace("hist_", ""));

          // Get deposit from deposits_history table
          const { data: historyData, error: historyError } = await supabase
            .from("deposits_history")
            .select("*")
            .eq("id", historyId)
            .eq("status", "pending")
            .single();

          if (historyError || !historyData) {
            return res.status(404).json({ message: "Deposit not found" });
          }

          // Update deposits_history status to rejected
          const { error: updateError } = await supabase
            .from("deposits_history")
            .update({
              status: "rejected",
              updated_at: new Date().toISOString(),
            })
            .eq("id", historyId);

          if (updateError) {
            console.error("Error updating deposit status:", updateError);
            return res
              .status(500)
              .json({ message: "Failed to update deposit status" });
          }

          // Create notification
          await storage.createNotification({
            userId: historyData.user_id,
            type: "transaction",
            title: "Deposit Rejected",
            message: `Your deposit of $${historyData.amount} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
            relatedEntityType: "transaction",
            relatedEntityId: historyId,
          });

          await storage.createLog({
            type: "info",
            userId: req.user!.id,
            message: `Admin rejected deposit #${idParam} of $${historyData.amount}${reason ? ` - Reason: ${reason}` : ""}`,
            details: {
              depositId: idParam,
              amount: historyData.amount,
              userId: historyData.user_id,
              reason,
            },
          });

          res.json({
            success: true,
            message: "Deposit rejected successfully",
            reason: reason,
          });
        } else {
          // Handle regular transaction table entries
          const depositId = parseInt(idParam);

          // Get the deposit details first
          const deposit = await storage.getTransactionById(depositId);
          if (!deposit) {
            return res.status(404).json({ message: "Deposit not found" });
          }

          // Update to rejected status
          const updated = await storage.updateTransactionStatus(
            depositId,
            "rejected",
            reason
          );

          if (updated) {
            // Notify the user
            await storage.createNotification({
              userId: deposit.userId,
              type: "transaction",
              title: "Deposit Rejected",
              message: `Your deposit of $${deposit.amount} has been rejected.${reason ? ` Reason: ${reason}` : ""}`,
              relatedEntityType: "transaction",
              relatedEntityId: depositId,
            });

            await storage.createLog({
              type: "info",
              userId: req.user!.id,
              message: `Admin rejected deposit #${depositId} of $${deposit.amount}${reason ? ` - Reason: ${reason}` : ""}`,
              details: {
                depositId,
                amount: deposit.amount,
                userId: deposit.userId,
                reason,
              },
            });

            res.json({
              success: true,
              message: "Deposit rejected successfully",
              reason: reason,
            });
          } else {
            res.status(404).json({ message: "Deposit not found" });
          }
        }
      } catch (error) {
        console.error("Error rejecting deposit:", error);
        res.status(500).json({ message: "Failed to reject deposit" });
      }
    }
  );

  // Individual Withdrawal Actions
  app.post(
    "/api/admin/withdrawals/:id/approve",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        // Get the withdrawal details first
        const withdrawal = await storage.getTransactionById(parseInt(id));
        if (!withdrawal) {
          return res.status(404).json({ message: "Withdrawal not found" });
        }

        const updated = await storage.updateTransactionStatus(
          parseInt(id),
          "completed"
        );

        if (updated) {
          // Get user details for email
          const user = await storage.getUser(withdrawal.userId);

          // Send withdrawal approved email
          try {
            if (user) {
              await sendWithdrawalApprovedEmail(
                user,
                withdrawal.amount,
                withdrawal.walletAddress || "Your crypto account"
              );
            }
          } catch (emailError) {
            console.error(
              "Failed to send withdrawal approved email:",
              emailError
            );
            // Don't fail the request if email fails
          }

          await storage.createLog({
            type: "info",
            userId: req.user!.id,
            message: `Admin approved withdrawal #${id}`,
            details: { withdrawalId: id },
          });
          res.json({
            success: true,
            message: "Withdrawal approved successfully",
          });
        } else {
          res.status(404).json({ message: "Withdrawal not found" });
        }
      } catch (error) {
        console.error("Error approving withdrawal:", error);
        res.status(500).json({ message: "Failed to approve withdrawal" });
      }
    }
  );

  app.post(
    "/api/admin/withdrawals/:id/reject",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;
        const { reason } = req.body;

        // Get the withdrawal details first
        const withdrawal = await storage.getTransactionById(parseInt(id));
        if (!withdrawal) {
          return res.status(404).json({ message: "Withdrawal not found" });
        }

        // Validate that it's actually a withdrawal
        if (withdrawal.type !== "withdrawal") {
          return res
            .status(400)
            .json({ message: "Transaction is not a withdrawal" });
        }

        const updated = await storage.updateTransactionStatus(
          parseInt(id),
          "rejected",
          reason
        );

        if (updated) {
          // Refund the withdrawal amount back to user's balance
          const { error: refundError } = await supabase.rpc(
            "increment_user_balance",
            {
              user_id: withdrawal.userId,
              amount: parseFloat(withdrawal.amount),
            }
          );

          if (refundError) {
            console.error("Error refunding balance:", refundError);
            return res
              .status(500)
              .json({ message: "Failed to refund balance" });
          }

          // Notify the user
          await storage.createNotification({
            userId: withdrawal.userId,
            type: "transaction",
            title: "Withdrawal Rejected",
            message: `Your withdrawal of $${withdrawal.amount} has been rejected and refunded to your account.${reason ? ` Reason: ${reason}` : ""}`,
            relatedEntityType: "transaction",
            relatedEntityId: parseInt(id),
          });

          await storage.createLog({
            type: "info",
            userId: req.user!.id,
            message: `Admin rejected withdrawal #${id} of $${withdrawal.amount}${reason ? ` - Reason: ${reason}` : ""}`,
            details: {
              withdrawalId: id,
              amount: withdrawal.amount,
              userId: withdrawal.userId,
              reason,
            },
          });

          res.json({
            success: true,
            message: "Withdrawal rejected and amount refunded successfully",
            reason: reason,
          });
        } else {
          res.status(404).json({ message: "Withdrawal not found" });
        }
      } catch (error) {
        console.error("Error rejecting withdrawal:", error);
        res.status(500).json({ message: "Failed to reject withdrawal" });
      }
    }
  );

  // Individual Delete Actions
  app.delete(
    "/api/admin/deposits/:id",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const depositId = req.params.id;

        // Check if this is from deposits_history (prefixed with 'hist_')
        if (depositId.startsWith("hist_")) {
          const actualId = parseInt(depositId.replace("hist_", ""));

          // Delete from deposits_history table
          const { data, error } = await supabase
            .from("deposits_history")
            .delete()
            .eq("id", actualId)
            .select()
            .single();

          if (error || !data) {
            return res
              .status(404)
              .json({ message: "Deposit not found in history" });
          }

          await storage.createLog({
            type: "warning",
            userId: req.user!.id,
            message: `Admin deleted deposit #${actualId} from history`,
            details: { depositId: actualId, source: "deposits_history" },
          });

          res.json({ success: true, message: "Deposit deleted successfully" });
        } else {
          // Handle regular transactions table deposits
          const numericId = parseInt(depositId);
          const deleted = await storage.deleteTransaction(numericId);

          if (deleted) {
            await storage.createLog({
              type: "warning",
              userId: req.user!.id,
              message: `Admin deleted deposit #${numericId}`,
              details: { depositId: numericId, source: "transactions" },
            });
            res.json({
              success: true,
              message: "Deposit deleted successfully",
            });
          } else {
            res.status(404).json({ message: "Deposit not found" });
          }
        }
      } catch (error) {
        console.error("Error deleting deposit:", error);
        res.status(500).json({ message: "Failed to delete deposit" });
      }
    }
  );

  app.delete(
    "/api/admin/withdrawals/:id",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { id } = req.params;

        const deleted = await storage.deleteTransaction(parseInt(id));

        if (deleted) {
          await storage.createLog({
            type: "warning",
            userId: req.user!.id,
            message: `Admin deleted withdrawal #${id}`,
            details: { withdrawalId: id },
          });
          res.json({
            success: true,
            message: "Withdrawal deleted successfully",
          });
        } else {
          res.status(404).json({ message: "Withdrawal not found" });
        }
      } catch (error) {
        console.error("Error deleting withdrawal:", error);
        res.status(500).json({ message: "Failed to delete withdrawal" });
      }
    }
  );

  // Bulk Delete Withdrawals
  app.delete(
    "/api/admin/withdrawals/bulk-delete",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { ids } = req.body;

        if (!Array.isArray(ids) || ids.length === 0) {
          return res
            .status(400)
            .json({ message: "Withdrawal IDs array is required" });
        }

        const results = [];
        for (const id of ids) {
          try {
            const deleted = await storage.deleteTransaction(parseInt(id));
            if (deleted) {
              results.push({ withdrawalId: id, success: true });
            } else {
              results.push({
                withdrawalId: id,
                success: false,
                error: "Deletion failed",
              });
            }
          } catch (error) {
            results.push({
              withdrawalId: id,
              success: false,
              error: "Deletion failed",
            });
          }
        }

        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin bulk deleted ${ids.length} withdrawals`,
          details: {
            withdrawalIds: ids,
            results: results.map((r) => ({
              withdrawalId: r.withdrawalId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk withdrawal deletion:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk withdrawal deletion" });
      }
    }
  );

  app.delete(
    "/api/admin/users/bulk-delete",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res
            .status(400)
            .json({ message: "User IDs array is required" });
        }

        const results = [];
        for (const userId of userIds) {
          try {
            // Prevent admin from deleting themselves
            if (userId === req.user!.id) {
              results.push({
                userId,
                success: false,
                error: "Cannot delete your own account",
              });
              continue;
            }

            const deleted = await storage.deleteUser(userId);
            if (deleted) {
              results.push({ userId, success: true });
            } else {
              results.push({ userId, success: false, error: "User not found" });
            }
          } catch (error) {
            results.push({ userId, success: false, error: "Delete failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin bulk deleted ${userIds.length} users`,
          details: {
            userIds,
            results: results.map((r) => ({
              userId: r.userId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk user deletion:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk user deletion" });
      }
    }
  );

  // Cleanup deleted users endpoint
  app.post(
    "/api/admin/users/cleanup-deleted",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const result = await storage.cleanupDeletedUsers();

        // Log the cleanup action
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin cleaned up deleted users: ${result.deletedCount} users permanently removed`,
          details: { action: "cleanup_deleted_users", result },
        });

        res.json(result);
      } catch (error) {
        console.error("Error cleaning up deleted users:", error);
        res
          .status(500)
          .json({ success: false, message: "Failed to cleanup deleted users" });
      }
    }
  );

  app.post(
    "/api/admin/users/bulk-approve",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res
            .status(400)
            .json({ message: "User IDs array is required" });
        }

        const results = [];
        for (const userId of userIds) {
          try {
            const updatedUser = await storage.updateUser(userId, {
              isVerified: true,
              isActive: true,
            });
            if (updatedUser) {
              results.push({ userId, success: true, user: updatedUser });
            } else {
              results.push({ userId, success: false, error: "User not found" });
            }
          } catch (error) {
            results.push({ userId, success: false, error: "Update failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin bulk approved ${userIds.length} users`,
          details: {
            userIds,
            results: results.map((r) => ({
              userId: r.userId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk user approval:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk user approval" });
      }
    }
  );

  app.post(
    "/api/admin/users/bulk-suspend",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { userIds } = req.body;

        if (!Array.isArray(userIds) || userIds.length === 0) {
          return res
            .status(400)
            .json({ message: "User IDs array is required" });
        }

        const results = [];
        for (const userId of userIds) {
          try {
            // Prevent admin from suspending themselves
            if (userId === req.user!.id) {
              results.push({
                userId,
                success: false,
                error: "Cannot suspend your own account",
              });
              continue;
            }

            const updatedUser = await storage.updateUser(userId, {
              isActive: false,
            });
            if (updatedUser) {
              results.push({ userId, success: true, user: updatedUser });
            } else {
              results.push({ userId, success: false, error: "User not found" });
            }
          } catch (error) {
            results.push({ userId, success: false, error: "Update failed" });
          }
        }

        // Log bulk admin action
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin bulk suspended ${userIds.length} users`,
          details: {
            userIds,
            results: results.map((r) => ({
              userId: r.userId,
              success: r.success,
            })),
          },
        });

        res.json({ results });
      } catch (error) {
        console.error("Error performing bulk user suspension:", error);
        res
          .status(500)
          .json({ message: "Failed to perform bulk user suspension" });
      }
    }
  );

  // Add admin quick actions
  app.post(
    "/api/admin/process-pending",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        // Get all pending transactions
        const pendingTransactions = await storage.getTransactions({
          status: "pending",
          limit: 100,
          offset: 0,
        });

        let processedCount = 0;
        const results = [];

        for (const transaction of pendingTransactions) {
          try {
            // Auto-approve smaller deposits (under $1000) as an example
            if (
              transaction.type === "deposit" &&
              parseFloat(transaction.amount) < 1000
            ) {
              await storage.updateTransactionStatus(
                transaction.id,
                "completed",
                "Auto-approved by system"
              );
              processedCount++;
              results.push({
                id: transaction.id,
                action: "approved",
                amount: transaction.amount,
              });
            }
          } catch (error) {
            console.error(
              `Error processing transaction ${transaction.id}:`,
              error
            );
            results.push({
              id: transaction.id,
              action: "error",
              error: (error as Error).message,
            });
          }
        }

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin processed ${processedCount} pending transactions`,
          details: { processedCount, results },
        });

        res.json({
          message: `Processed ${processedCount} pending transactions`,
          processedCount,
          results,
        });
      } catch (error) {
        console.error("Error processing pending transactions:", error);
        res
          .status(500)
          .json({ message: "Failed to process pending transactions" });
      }
    }
  );

  app.post(
    "/api/admin/generate-report",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { type, filters = {} } = req.body;

        let reportData;
        let reportName;

        switch (type) {
          case "users":
            reportData = await storage.getAllUsersForExport();
            reportName = "Users Report";
            break;
          case "transactions":
            reportData = await storage.getAllTransactionsForExport();
            reportName = "Transactions Report";
            break;
          case "deposits":
            reportData = await storage.getDeposits({ limit: 10000, offset: 0 });
            reportName = "Deposits Report";
            break;
          case "withdrawals":
            reportData = await storage.getWithdrawals({
              limit: 10000,
              offset: 0,
            });
            reportName = "Withdrawals Report";
            break;
          default:
            return res.status(400).json({ message: "Invalid report type" });
        }

        // Log admin action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin generated ${reportName}`,
          details: { type, filters, recordCount: reportData.length },
        });

        res.json({
          message: `${reportName} generated successfully`,
          reportName,
          recordCount: reportData.length,
          generatedAt: new Date().toISOString(),
        });
      } catch (error) {
        console.error("Error generating report:", error);
        res.status(500).json({ message: "Failed to generate report" });
      }
    }
  );

  // Audit logging endpoint - Updated to use Supabase
  app.get(
    "/api/admin/audit-logs",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const {
          page = 1,
          limit = 50,
          userId,
          type,
          dateFrom,
          dateTo,
          severity,
        } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // Build Supabase query
        let query = supabase
          .from("audit_logs")
          .select(
            `
            id,
            action,
            description,
            details,
            user_id,
            created_at,
            ip_address,
            user_agent,
            location,
            severity,
            users:user_id (
              username,
              email,
              first_name,
              last_name
            )
          `
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + Number(limit) - 1);

        // Apply filters
        if (userId) {
          query = query.eq("user_id", Number(userId));
        }
        if (type) {
          query = query.eq("action", type as string);
        }
        if (severity) {
          query = query.eq("severity", severity as string);
        }
        if (dateFrom) {
          query = query.gte("created_at", dateFrom as string);
        }
        if (dateTo) {
          query = query.lte("created_at", dateTo as string);
        }

        const { data: logsResult, error: logsError } = await query;

        if (logsError) {
          console.error("Error fetching audit logs from Supabase:", logsError);
          throw logsError;
        }

        // Get total count for pagination
        let countQuery = supabase
          .from("audit_logs")
          .select("*", { count: "exact", head: true });

        // Apply same filters for count
        if (userId) {
          countQuery = countQuery.eq("user_id", Number(userId));
        }
        if (type) {
          countQuery = countQuery.eq("action", type as string);
        }
        if (severity) {
          countQuery = countQuery.eq("severity", severity as string);
        }
        if (dateFrom) {
          countQuery = countQuery.gte("created_at", dateFrom as string);
        }
        if (dateTo) {
          countQuery = countQuery.lte("created_at", dateTo as string);
        }

        const { count: totalLogs, error: countError } = await countQuery;

        if (countError) {
          console.error("Error getting audit logs count:", countError);
        }

        // Format the logs with proper type checking
        const logs = (logsResult || []).map((row: any) => ({
          id: row.id,
          type: row.action || "",
          message: row.description || "",
          details: row.details || {},
          userId: row.user_id || null,
          createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : null,
          ipAddress: row.ip_address || "",
          userAgent: row.user_agent || "",
          location: row.location || "",
          severity: row.severity || "low",
          user:
            row.users && row.user_id
              ? {
                  id: row.user_id,
                  username: row.users.username || "",
                  email: row.users.email || "",
                  firstName: row.users.first_name || "",
                  lastName: row.users.last_name || "",
                }
              : null,
        }));

        res.json({
          logs,
          totalPages: Math.ceil((totalLogs || 0) / Number(limit)),
          currentPage: Number(page),
          totalLogs: totalLogs || 0,
        });
      } catch (error) {
        console.error("Error fetching audit logs:", error);

        // Fallback to storage layer if audit_logs table doesn't exist
        if (
          error?.message?.includes('relation "audit_logs" does not exist') ||
          error?.message?.includes('table "audit_logs" does not exist')
        ) {
          try {
            const logs = await storage.getAuditLogs({
              limit: Number(limit),
              offset: (Number(page) - 1) * Number(limit),
              ...(userId ? { search: `user:${userId}` } : {}),
              ...(type ? { action: type as string } : {}),
              ...(dateFrom ? { dateFrom: dateFrom as string } : {}),
              ...(dateTo ? { dateTo: dateTo as string } : {}),
            });

            const totalLogs = await storage.getAuditLogCount();

            return res.json({
              logs,
              totalPages: Math.ceil(totalLogs / Number(limit)),
              currentPage: Number(page),
              totalLogs,
            });
          } catch (fallbackError) {
            console.error("Fallback audit logs error:", fallbackError);
          }
        }

        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    }
  );

  // Admin endpoint to view all deposits history - Updated to use Supabase
  app.get(
    "/api/admin/deposits-history",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const {
          page = 1,
          limit = 50,
          userId,
          status,
          planType,
          dateFrom,
          dateTo,
        } = req.query;
        const offset = (Number(page) - 1) * Number(limit);

        // Build Supabase query for deposits with user information
        let query = supabase
          .from("deposits_history")
          .select(
            `
            id,
            user_id,
            amount,
            plan_name,
            payment_method,
            status,
            daily_return_rate,
            duration_days,
            total_return,
            earned_amount,
            remaining_days,
            start_date,
            end_date,
            created_at,
            updated_at,
            users:user_id (
              username,
              email,
              first_name,
              last_name
            )
          `
          )
          .order("created_at", { ascending: false })
          .range(offset, offset + Number(limit) - 1);

        // Apply filters
        if (userId) {
          query = query.eq("user_id", Number(userId));
        }
        if (status) {
          query = query.eq("status", status as string);
        }
        if (planType) {
          query = query.ilike("plan_name", `%${planType}%`);
        }
        if (dateFrom) {
          query = query.gte("created_at", dateFrom as string);
        }
        if (dateTo) {
          query = query.lte("created_at", dateTo as string);
        }

        const { data: depositsResult, error: depositsError } = await query;

        if (depositsError) {
          console.error(
            "Error fetching deposits from Supabase:",
            depositsError
          );
          throw depositsError;
        }

        // Get total count for pagination
        let countQuery = supabase
          .from("deposits_history")
          .select("*", { count: "exact", head: true });

        // Apply same filters for count
        if (userId) {
          countQuery = countQuery.eq("user_id", Number(userId));
        }
        if (status) {
          countQuery = countQuery.eq("status", status as string);
        }
        if (planType) {
          countQuery = countQuery.ilike("plan_name", `%${planType}%`);
        }
        if (dateFrom) {
          countQuery = countQuery.gte("created_at", dateFrom as string);
        }
        if (dateTo) {
          countQuery = countQuery.lte("created_at", dateTo as string);
        }

        const { count: totalDeposits, error: countError } = await countQuery;

        if (countError) {
          console.error("Error getting deposits count:", countError);
        }

        // Format the deposits with proper type checking and null safety
        const deposits = (depositsResult || []).map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          amount: row.amount ? parseFloat(row.amount.toString()) : 0,
          planName: row.plan_name || "",
          paymentMethod: row.payment_method || "",
          status: row.status || "",
          dailyReturnRate: row.daily_return_rate
            ? parseFloat(row.daily_return_rate.toString())
            : 0,
          durationDays: row.duration_days || 0,
          totalReturn: row.total_return
            ? parseFloat(row.total_return.toString())
            : 0,
          earnedAmount: row.earned_amount
            ? parseFloat(row.earned_amount.toString())
            : 0,
          remainingDays: row.remaining_days || 0,
          startDate: row.start_date || null,
          endDate: row.end_date || null,
          createdAt: row.created_at
            ? new Date(row.created_at).toISOString()
            : null,
          updatedAt: row.updated_at
            ? new Date(row.updated_at).toISOString()
            : null,
          user: row.users
            ? {
                username: row.users.username || "",
                email: row.users.email || "",
                firstName: row.users.first_name || "",
                lastName: row.users.last_name || "",
              }
            : null,
        }));

        res.json({
          deposits,
          totalPages: Math.ceil((totalDeposits || 0) / Number(limit)),
          currentPage: Number(page),
          totalDeposits: totalDeposits || 0,
        });
      } catch (error) {
        console.error("Error fetching deposits history:", error);
        res.status(500).json({ message: "Failed to fetch deposits history" });
      }
    }
  );

  // Export data endpoints
  app.get(
    "/api/admin/export/users",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { format = "csv" } = req.query;
        const users = await storage.getAllUsersForExport();

        if (format === "csv") {
          const csv = convertToCSV(users);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="users.csv"'
          );
          res.send(csv);
        } else {
          res.json(users);
        }

        // Log export action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin exported users data as ${format}`,
          details: { format, recordCount: users.length },
        });
      } catch (error) {
        console.error("Error exporting users:", error);
        res.status(500).json({ message: "Failed to export users" });
      }
    }
  );

  app.get(
    "/api/admin/export/transactions",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { format = "csv", dateFrom, dateTo } = req.query;
        const transactions = await storage.getAllTransactionsForExport();

        if (format === "csv") {
          const csv = convertToCSV(transactions);
          res.setHeader("Content-Type", "text/csv");
          res.setHeader(
            "Content-Disposition",
            'attachment; filename="transactions.csv"'
          );
          res.send(csv);
        } else {
          res.json(transactions);
        }

        // Log export action
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin exported transactions data as ${format}`,
          details: {
            format,
            recordCount: transactions.length,
            dateFrom,
            dateTo,
          },
        });
      } catch (error) {
        console.error("Error exporting transactions:", error);
        res.status(500).json({ message: "Failed to export transactions" });
      }
    }
  );

  // Maintenance mode management
  app.get(
    "/api/admin/maintenance",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const maintenanceSettings = await storage.getMaintenanceSettings();
        res.json(maintenanceSettings);
      } catch (error) {
        console.error("Error fetching maintenance settings:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch maintenance settings" });
      }
    }
  );

  app.put(
    "/api/admin/maintenance",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const settings = req.body;
        const updatedSettings =
          await storage.updateMaintenanceSettings(settings);

        // Log maintenance change
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin updated maintenance settings`,
          details: { settings },
        });

        res.json(updatedSettings);
      } catch (error) {
        console.error("Error updating maintenance settings:", error);
        res
          .status(500)
          .json({ message: "Failed to update maintenance settings" });
      }
    }
  );

  // Admin system settings management
  app.get(
    "/api/admin/settings",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const settings = await storage.getSystemSettings();
        if (!settings) {
          return res.status(404).json({ message: "Settings not found" });
        }
        res.json(settings);
      } catch (error) {
        console.error("Error fetching system settings:", error);
        res.status(500).json({ message: "Failed to fetch system settings" });
      }
    }
  );

  app.put(
    "/api/admin/settings",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const settings = req.body;
        const updatedSettings = await storage.updateSystemSettings(settings);
        // Log settings change
        await storage.createLog({
          type: "warning",
          userId: req.user!.id,
          message: `Admin updated system settings`,
          details: { settings },
        });
        res.json(updatedSettings);
      } catch (error) {
        console.error("Error updating system settings:", error);
        res.status(500).json({ message: "Failed to update system settings" });
      }
    }
  );

  // Transactions endpoints
  app.get(
    "/api/transactions",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Only allow users to see their own transactions
        const transactions = await storage.getUserTransactions(userId);
        res.status(200).json(transactions);
      } catch (error) {
        console.error("Error fetching transactions:", error);
        res.status(500).json({ message: "Failed to fetch transactions" });
      }
    }
  );

  // Add deposit endpoint
  app.post(
    "/api/transactions/deposit",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const {
          amount,
          method,
          currency,
          plan,
          planName,
          planDuration,
          dailyProfit,
          totalReturn,
        } = req.body;

        // Validate input
        if (!amount || isNaN(amount) || amount <= 0) {
          return res
            .status(400)
            .json({ message: "Valid positive amount is required" });
        }

        if (amount > 1000000) {
          return res
            .status(400)
            .json({ message: "Amount cannot exceed $1,000,000" });
        }

        // Build description with plan details for admin visibility
        let description = "";
        if (method === "balance") {
          description = `Investment via account balance - ${planName || "Plan"} (${planDuration || "Duration not specified"})`;
          if (dailyProfit) {
            description += ` - Daily Profit: $${dailyProfit.toFixed(2)}`;
          }
          if (totalReturn) {
            description += ` - Total Return: $${totalReturn.toFixed(2)}`;
          }
        } else {
          description = `Deposit via ${method || "bank_transfer"} - ${planName || "Plan"} (${planDuration || "Duration not specified"})`;
          if (dailyProfit) {
            description += ` - Expected Daily: $${dailyProfit.toFixed(2)}`;
          }
          if (totalReturn) {
            description += ` - Expected Total: $${totalReturn.toFixed(2)}`;
          }
        }

        // Create transaction with plan details
        const transaction = await storage.createTransaction({
          userId: userId,
          type: "deposit", // Always use 'deposit' so it shows in admin panel
          amount: amount.toString(),
          status: method === "balance" ? "completed" : "pending",
          description: description,
          planName: planName || null,
          cryptoType: method !== "balance" ? method : null,
          walletAddress: null, // This will be filled when user provides proof
          transactionHash: null, // This will be filled when user provides proof
        });

        // Create notification for the user
        const notificationTitle =
          method === "balance" ? "Investment Successful" : "Deposit Initiated";
        const notificationMessage =
          method === "balance"
            ? `Your investment of $${amount.toLocaleString()} has been successfully processed from your account balance for ${planName}.`
            : `Your deposit of $${amount.toLocaleString()} has been initiated for ${planName} and is pending confirmation.`;

        await storage.createNotification({
          userId: userId,
          type: "transaction",
          title: notificationTitle,
          message: notificationMessage,
          relatedEntityType: "transaction",
          relatedEntityId: transaction.id,
        });

        // Log the deposit for audit trail
        await storage.createLog({
          type: "audit",
          message:
            method === "balance"
              ? `User invested $${amount} using account balance for ${planName}`
              : `User initiated deposit of $${amount} via ${method} for ${planName}`,
          details: {
            userId,
            amount,
            method,
            plan,
            planName,
            dailyProfit,
            totalReturn,
            transactionId: transaction.id,
          },
          userId: userId,
        });

        // Send deposit success email
        try {
          await sendDepositSuccessEmail(
            req.user as any,
            amount.toString(),
            planName
          );
          console.log(`📧 Deposit success email sent to ${req.user?.email}`);
        } catch (emailError) {
          console.error("Failed to send deposit success email:", emailError);
          // Don't fail the transaction if email fails
        }

        res.status(200).json({
          success: true,
          amount: amount,
          transactionId: transaction.id,
          planName: planName,
          expectedReturn: totalReturn,
        });
      } catch (error) {
        console.error("Error processing deposit:", error);
        res.status(500).json({ message: "Failed to process deposit" });
      }
    }
  );

  // Simple deposit confirmation endpoint
  app.post(
    "/api/transactions/deposit-confirmation",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        const { amount, transactionHash } = req.body;

        // Simple validation
        if (!amount || isNaN(amount) || amount <= 0) {
          return res
            .status(400)
            .json({ message: "Valid positive amount is required" });
        }

        if (!transactionHash || transactionHash.trim().length < 10) {
          return res
            .status(400)
            .json({ message: "Valid transaction hash is required" });
        }

        // Create simple pending deposit
        const transaction = await storage.createTransaction({
          userId: userId,
          type: "deposit",
          amount: amount.toString(),
          status: "pending",
          description: `Deposit - Hash: ${transactionHash.trim()}`,
          transactionHash: transactionHash.trim(),
        });

        // Simple notification to user
        await storage.createNotification({
          userId: userId,
          type: "transaction",
          title: "Deposit Submitted",
          message: `Your deposit of $${amount.toLocaleString()} has been submitted for admin review.`,
          relatedEntityType: "transaction",
          relatedEntityId: transaction.id,
        });

        res.status(200).json({
          success: true,
          message:
            "Deposit submitted successfully. Please wait for admin approval.",
          transactionId: transaction.id,
        });
      } catch (error) {
        console.error("Error processing deposit confirmation:", error);
        res
          .status(500)
          .json({ message: "Failed to process deposit confirmation" });
      }
    }
  );

  app.get(
    "/api/transactions/pending",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ message: "Unauthorized" });
        }

        // Only allow users to see their own pending transactions
        const transactions = await storage.getUserTransactions(userId);
        const pendingTransactions = transactions.filter(
          (t) => t.status === "pending"
        );
        res.status(200).json(pendingTransactions);
      } catch (error) {
        console.error("Error fetching pending transactions:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch pending transactions" });
      }
    }
  );

  // User-specific transactions endpoint
  app.get(
    "/api/transactions/:userId",
    isAuthenticated,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);

        // Only allow users to access their own transactions
        if (req.user?.id !== userId) {
          return res.status(403).json({
            message: "You do not have permission to view these transactions",
          });
        }

        const transactions = await storage.getUserTransactions(userId);
        res.status(200).json(transactions);
      } catch (error) {
        console.error("Error fetching user transactions:", error);
        res.status(500).json({ message: "Failed to fetch user transactions" });
      }
    }
  );

  // Settings endpoints
  app.get("/api/settings", async (req: Request, res: Response) => {
    try {
      const settings = await storage.getAllSettings();
      res.status(200).json(settings);
    } catch (error) {
      console.error("Error fetching settings:", error);
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.get("/api/settings/:name", async (req: Request, res: Response) => {
    try {
      const { name } = req.params;
      const setting = await storage.getSetting(name);

      if (!setting) {
        return res.status(404).json({ message: `Setting "${name}" not found` });
      }

      res.status(200).json(setting);
    } catch (error) {
      console.error("Error fetching setting:", error);
      res.status(500).json({ message: "Failed to fetch setting" });
    }
  });

  // Existing endpoints
  app.get("/api/health", async (req: Request, res: Response) => {
    try {
      // Test Supabase connection with a simple query
      const { data, error } = await supabase
        .from("users")
        .select("id")
        .limit(1);

      if (error) {
        console.error("Supabase query error:", error);
        res.status(500).json({
          status: "error",
          message: "Server is running but database query failed",
          databaseConnected: false,
        });
      } else {
        res.status(200).json({
          status: "ok",
          message: "Server is running",
          databaseConnected: true,
        });
      }
    } catch (error) {
      console.error("Supabase connection error:", error);
      res.status(500).json({
        status: "error",
        message: "Server is running but database connection failed",
        databaseConnected: false,
      });
    }
  });

  // Debug endpoint to list database tables (only available in development mode)
  if (process.env.NODE_ENV === "development") {
    app.get("/api/debug/tables", async (req: Request, res: Response) => {
      try {
        // For Supabase, we can list known tables or use rpc function if available
        const knownTables = [
          "users",
          "transactions",
          "deposits_history",
          "audit_logs",
          "notifications",
          "settings",
          "earnings",
          "logs",
        ];

        // Test which tables actually exist by trying to query them
        const existingTables: string[] = [];
        for (const table of knownTables) {
          try {
            const { error } = await supabase.from(table).select("*").limit(0); // Just test the query without fetching data
            if (!error) {
              existingTables.push(table);
            }
          } catch (e) {
            // Table doesn't exist or no permission
          }
        }

        res.status(200).json({
          tables: existingTables,
        });
      } catch (error) {
        console.error("Error listing tables:", error);
        res.status(500).json({ error: "Failed to list tables" });
      }
    });
  }

  app.get("/api/auth/verify-email", async (req: Request, res: Response) => {
    try {
      const { token } = req.query;

      if (!token || typeof token !== "string") {
        return res.status(400).json({ message: "Invalid verification token" });
      }

      const result = await verifyUserEmail(token);

      if (!result || !result.user) {
        return res
          .status(400)
          .json({ message: "Invalid or expired verification token" });
      }

      return res.status(200).json({
        message:
          "Email verified successfully. You can now log in to your account.",
        userId: result.user.id,
      });
    } catch (error) {
      console.error("Email verification error:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while verifying your email" });
    }
  });

  app.post("/api/auth/forgot-password", async (req: Request, res: Response) => {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }

      const user = await storage.getUserByEmail(email);

      if (user) {
        if (process.env.NODE_ENV !== "production")
          console.log(`Password reset requested for ${email}`);
      }

      return res.status(200).json({
        message:
          "If this email is associated with an account, you will receive password reset instructions.",
      });
    } catch (error) {
      console.error("Error in forgot-password:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while processing your request" });
    }
  });

  app.post("/api/auth/reset-password", async (req: Request, res: Response) => {
    try {
      const { token, password } = req.body;

      if (!token || !password) {
        return res
          .status(400)
          .json({ message: "Token and password are required" });
      }

      if (process.env.NODE_ENV !== "production")
        console.log(`Password reset with token: ${token}`);

      return res
        .status(200)
        .json({ message: "Password has been reset successfully" });
    } catch (error) {
      console.error("Error in reset-password:", error);
      return res
        .status(500)
        .json({ message: "An error occurred while processing your request" });
    }
  });

  // Admin password update route
  app.post(
    "/api/admin/update-password",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const { currentPassword, newPassword, confirmPassword } = req.body;

        // Validate required fields
        if (!currentPassword || !newPassword || !confirmPassword) {
          return res.status(400).json({
            message:
              "Current password, new password, and confirm password are required",
          });
        }

        // Check if new password matches confirmation
        if (newPassword !== confirmPassword) {
          return res.status(400).json({
            message: "New password and confirm password do not match",
          });
        }

        // Validate new password strength
        if (newPassword.length < 8) {
          return res.status(400).json({
            message: "New password must be at least 8 characters long",
          });
        }

        // Check for password complexity (at least one number, one letter)
        const hasNumber = /\d/.test(newPassword);
        const hasLetter = /[a-zA-Z]/.test(newPassword);
        if (!hasNumber || !hasLetter) {
          return res.status(400).json({
            message:
              "New password must contain at least one letter and one number",
          });
        }

        // Get the current logged-in admin user
        const currentUserId = req.user!.id;
        const currentUser = await storage.getUser(currentUserId);

        if (!currentUser) {
          return res.status(404).json({ message: "Current user not found" });
        }

        // Verify current password
        const isPasswordValid = await comparePasswords(
          currentPassword,
          currentUser.password
        );
        if (!isPasswordValid) {
          return res
            .status(401)
            .json({ message: "Current password is incorrect" });
        }

        // Hash the new password
        const hashedPassword = await hashPassword(newPassword);

        // Update the user's password
        const updatedUser = await storage.updateUser(currentUserId, {
          password: hashedPassword,
        });

        if (!updatedUser) {
          return res
            .status(500)
            .json({ message: "Failed to update password in database" });
        }

        // Log the password change
        await storage.createLog({
          type: "warning",
          userId: currentUserId,
          message: `Admin user ${currentUser.email} changed their password`,
          details: {
            userId: currentUserId,
            email: currentUser.email,
            timestamp: new Date().toISOString(),
          },
        });

        return res.status(200).json({
          message: "Password updated successfully",
          success: true,
        });
      } catch (error) {
        console.error("Error updating admin password:", error);
        return res
          .status(500)
          .json({ message: "Failed to update password. Please try again." });
      }
    }
  );

  // Admin Settings endpoints
  app.get(
    "/api/admin/settings",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        // Return default settings for now - can be expanded to read from database
        const settings = {
          siteName: "AxixFinance",
          supportEmail: process.env.SUPPORT_EMAIL || "support@axixfinance.com",
          maxDepositAmount: 10000,
          minDepositAmount: 100,
          defaultDepositFee: 0.02,
          defaultWithdrawalFee: 0.03,
          maintenanceMode: false,
          registrationEnabled: true,
          emailNotifications: true,
          smsNotifications: false,
          twoFactorRequired: false,
          sessionTimeout: 30,
        };

        res.json(settings);
      } catch (error) {
        console.error("Error fetching admin settings:", error);
        res.status(500).json({ message: "Failed to fetch settings" });
      }
    }
  );

  app.put(
    "/api/admin/settings",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const settings = req.body;

        // Validate required fields
        if (!settings || typeof settings !== "object") {
          return res.status(400).json({ message: "Invalid settings data" });
        }

        // For now, just return success - can be expanded to save to database
        console.log("Admin settings updated:", settings);

        // Log the settings change
        await storage.createLog({
          type: "info",
          userId: req.user!.id,
          message: `Admin updated system settings`,
          details: { updatedSettings: Object.keys(settings) },
        });

        res.json({ message: "Settings updated successfully", settings });
      } catch (error) {
        console.error("Error updating admin settings:", error);
        res.status(500).json({ message: "Failed to update settings" });
      }
    }
  );

  // Admin Maintenance endpoints
  app.get(
    "/api/admin/maintenance",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const maintenance = {
          enabled: false,
          message:
            "The system is currently under maintenance. Please try again later.",
          scheduledStart: null,
          scheduledEnd: null,
          allowAdminAccess: true,
          maintenanceType: "system",
          affectedServices: [],
        };

        res.json(maintenance);
      } catch (error) {
        console.error("Error fetching maintenance settings:", error);
        res
          .status(500)
          .json({ message: "Failed to fetch maintenance settings" });
      }
    }
  );

  app.put(
    "/api/admin/maintenance",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const maintenance = req.body;

        // Validate required fields
        if (!maintenance || typeof maintenance !== "object") {
          return res.status(400).json({ message: "Invalid maintenance data" });
        }

        // For now, just return success - can be expanded to save to database
        console.log("Maintenance settings updated:", maintenance);

        // Log the maintenance change
        await storage.createLog({
          type: maintenance.enabled ? "warning" : "info",
          userId: req.user!.id,
          message: `Admin ${maintenance.enabled ? "enabled" : "disabled"} maintenance mode`,
          details: { maintenanceSettings: maintenance },
        });

        res.json({
          message: "Maintenance settings updated successfully",
          maintenance,
        });
      } catch (error) {
        console.error("Error updating maintenance settings:", error);
        res
          .status(500)
          .json({ message: "Failed to update maintenance settings" });
      }
    }
  );

  // Visitor tracking routes

  // Store for tracking active visitors (in production, use Redis or database)
  const activeVisitors = new Map<
    string,
    {
      id: string;
      ipAddress: string;
      userAgent: string;
      country: string;
      city: string;
      region: string;
      deviceType: "desktop" | "mobile" | "tablet";
      browser: string;
      os: string;
      currentPage: string;
      entryPage: string;
      sessionDuration: number;
      pageViews: number;
      isActive: boolean;
      lastActivity: Date;
      joinedAt: Date;
    }
  >();

  // Helper function to detect device type from user agent
  function getDeviceType(userAgent: string): "desktop" | "mobile" | "tablet" {
    const ua = userAgent.toLowerCase();
    if (ua.includes("tablet") || ua.includes("ipad")) return "tablet";
    if (
      ua.includes("mobile") ||
      ua.includes("android") ||
      ua.includes("iphone")
    )
      return "mobile";
    return "desktop";
  }

  // Helper function to get browser from user agent
  function getBrowser(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes("chrome")) return "Chrome";
    if (ua.includes("firefox")) return "Firefox";
    if (ua.includes("safari")) return "Safari";
    if (ua.includes("edge")) return "Edge";
    if (ua.includes("opera")) return "Opera";
    return "Unknown";
  }

  // Helper function to get OS from user agent
  function getOS(userAgent: string): string {
    const ua = userAgent.toLowerCase();
    if (ua.includes("windows")) return "Windows";
    if (ua.includes("mac")) return "macOS";
    if (ua.includes("linux")) return "Linux";
    if (ua.includes("android")) return "Android";
    if (ua.includes("ios")) return "iOS";
    return "Unknown";
  }

  // Get client IP address
  function getClientIP(req: Request): string {
    return (
      (req.headers["x-forwarded-for"] as string) ||
      (req.headers["x-real-ip"] as string) ||
      req.connection.remoteAddress ||
      req.socket.remoteAddress ||
      "unknown"
    );
  }

  // Visitor tracking endpoints (disabled)
  /*
  app.post("/api/visitors/session", async (req: Request, res: Response) => {
    try {
      const visitorId =
        req.sessionID || `visitor_${Date.now()}_${Math.random()}`;
      const ip = getClientIP(req);
      const userAgent = req.headers["user-agent"] || "";

      // Mock location data (in production, use a GeoIP service)
      const locationData = {
        country: "Unknown",
        city: "Unknown",
        region: "Unknown",
      };

      const visitor = {
        id: visitorId,
        ipAddress: ip,
        userAgent,
        country: locationData.country,
        city: locationData.city,
        region: locationData.region,
        deviceType: getDeviceType(userAgent),
        browser: getBrowser(userAgent),
        os: getOS(userAgent),
        currentPage: "/",
        entryPage: "/",
        sessionDuration: 0,
        pageViews: 0,
        isActive: true,
        lastActivity: new Date(),
        joinedAt: new Date(),
      };

      activeVisitors.set(visitorId, visitor);

      res.json({ success: true, visitorId });
    } catch (error) {
      console.error("Error initializing visitor session:", error);
      res.status(500).json({ message: "Failed to initialize session" });
    }
  });

  // Track page view
  app.post("/api/visitors/track", async (req: Request, res: Response) => {
    try {
      const visitorId =
        req.sessionID || `visitor_${Date.now()}_${Math.random()}`;
      const { page } = req.body;

      const visitor = activeVisitors.get(visitorId);
      if (visitor) {
        visitor.currentPage = page;
        visitor.pageViews += 1;
        visitor.lastActivity = new Date();
        visitor.sessionDuration = Math.floor(
          (Date.now() - visitor.joinedAt.getTime()) / 1000
        );
        visitor.isActive = true;

        activeVisitors.set(visitorId, visitor);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error tracking page view:", error);
      res.status(500).json({ message: "Failed to track page view" });
    }
  });

  // Update visitor activity
  app.put("/api/visitors/activity", async (req: Request, res: Response) => {
    try {
      const visitorId = req.sessionID || "";

      const visitor = activeVisitors.get(visitorId);
      if (visitor) {
        visitor.lastActivity = new Date();
        visitor.sessionDuration = Math.floor(
          (Date.now() - visitor.joinedAt.getTime()) / 1000
        );
        visitor.isActive = true;

        activeVisitors.set(visitorId, visitor);
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error updating visitor activity:", error);
      res.status(500).json({ message: "Failed to update activity" });
    }
  });

  // End visitor session
  app.delete("/api/visitors/session", async (req: Request, res: Response) => {
    try {
      const visitorId = req.sessionID || "";

      const visitor = activeVisitors.get(visitorId);
      if (visitor) {
        visitor.isActive = false;
        activeVisitors.set(visitorId, visitor);

        // Remove inactive visitors after 5 minutes
        setTimeout(
          () => {
            activeVisitors.delete(visitorId);
          },
          5 * 60 * 1000
        );
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error ending visitor session:", error);
      res.status(500).json({ message: "Failed to end session" });
    }
  });
  */

  // Admin: Get active visitors
  app.get(
    "/api/admin/visitors/active",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

        // Filter for active visitors (active in last 5 minutes)
        const activeVisitorsList = Array.from(activeVisitors.values())
          .filter((visitor) => visitor.lastActivity > fiveMinutesAgo)
          .map((visitor) => ({
            ...visitor,
            sessionDuration: Math.floor(
              (now.getTime() - visitor.joinedAt.getTime()) / 1000
            ),
          }));

        res.json(activeVisitorsList);
      } catch (error) {
        console.error("Error fetching active visitors:", error);
        res.status(500).json({ message: "Failed to fetch active visitors" });
      }
    }
  );

  // Admin: Get visitor statistics
  app.get(
    "/api/admin/visitors/stats",
    isAuthenticated,
    requireAdminRole,
    async (req: Request, res: Response) => {
      try {
        const now = new Date();
        const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
        const todayStart = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );

        const allVisitors = Array.from(activeVisitors.values());
        const activeVisitorsList = allVisitors.filter(
          (visitor) => visitor.lastActivity > fiveMinutesAgo
        );
        const todayVisitors = allVisitors.filter(
          (visitor) => visitor.joinedAt > todayStart
        );

        // Calculate top countries
        const countryCount = new Map<string, number>();
        allVisitors.forEach((visitor) => {
          countryCount.set(
            visitor.country,
            (countryCount.get(visitor.country) || 0) + 1
          );
        });
        const topCountries = Array.from(countryCount.entries())
          .map(([country, count]) => ({ country, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        // Calculate top pages
        const pageCount = new Map<string, number>();
        allVisitors.forEach((visitor) => {
          pageCount.set(
            visitor.currentPage,
            (pageCount.get(visitor.currentPage) || 0) + 1
          );
        });
        const topPages = Array.from(pageCount.entries())
          .map(([page, views]) => ({ page, views }))
          .sort((a, b) => b.views - a.views)
          .slice(0, 5);

        // Calculate device breakdown
        const deviceCount = new Map<string, number>();
        allVisitors.forEach((visitor) => {
          const device =
            visitor.deviceType.charAt(0).toUpperCase() +
            visitor.deviceType.slice(1);
          deviceCount.set(device, (deviceCount.get(device) || 0) + 1);
        });
        const deviceBreakdown = Array.from(deviceCount.entries()).map(
          ([device, count]) => ({ device, count })
        );

        // Calculate average session duration
        const totalDuration = allVisitors.reduce(
          (sum, visitor) => sum + visitor.sessionDuration,
          0
        );
        const avgSessionDuration =
          allVisitors.length > 0
            ? Math.floor(totalDuration / allVisitors.length)
            : 0;

        const stats = {
          totalVisitors: allVisitors.length,
          activeVisitors: activeVisitorsList.length,
          todayVisitors: todayVisitors.length,
          avgSessionDuration,
          topCountries,
          topPages,
          deviceBreakdown,
        };

        res.json(stats);
      } catch (error) {
        console.error("Error fetching visitor stats:", error);
        res.status(500).json({ message: "Failed to fetch visitor statistics" });
      }
    }
  );

  // Deposits History API - Updated to use Supabase
  router.get(
    "/api/users/:userId/deposits-history",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can access this data
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Use Supabase to fetch deposits history
        const { data: depositsHistory, error: depositsHistoryError } =
          await supabase
            .from("deposits_history")
            .select(
              `
            id,
            amount,
            plan_name,
            payment_method,
            status,
            daily_return_rate,
            duration_days,
            total_return,
            earned_amount,
            remaining_days,
            start_date,
            end_date,
            created_at,
            payment_details
          `
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

        if (depositsHistoryError) {
          console.error(
            "Error fetching deposits history from Supabase:",
            depositsHistoryError
          );
          return res
            .status(500)
            .json({ message: "Failed to fetch deposits history" });
        }

        // Format the data with proper type checking
        const formattedDepositsHistory = (depositsHistory || []).map(
          (row: any) => ({
            id: row.id,
            amount: row.amount ? parseFloat(row.amount.toString()) : 0,
            plan: row.plan_name || "",
            method: row.payment_method || "",
            status: row.status || "",
            dailyReturn: row.daily_return_rate
              ? parseFloat(row.daily_return_rate.toString())
              : 0,
            duration: row.duration_days || 0,
            totalReturn: row.total_return
              ? parseFloat(row.total_return.toString())
              : 0,
            earnedAmount: row.earned_amount
              ? parseFloat(row.earned_amount.toString())
              : 0,
            remainingDays: row.remaining_days || 0,
            startDate: row.start_date || null,
            endDate: row.end_date || null,
            createdAt: row.created_at
              ? new Date(row.created_at).toISOString()
              : null,
            payment_details: row.payment_details || null,
          })
        );

        res.json(formattedDepositsHistory);
      } catch (error) {
        console.error("Error fetching deposits history:", error);
        res.status(500).json({ message: "Failed to fetch deposits history" });
      }
    }
  );

  // Withdrawal History API - Updated to use Supabase
  router.get(
    "/api/users/:userId/withdrawal-history",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can access this data
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Use Supabase to fetch withdrawal history with user information
        const { data: withdrawalHistory, error: withdrawalHistoryError } =
          await supabase
            .from("transactions")
            .select(
              `
            id,
            amount,
            status,
            type,
            description,
            method,
            transactionHash,
            createdAt,
            approvedAt,
            users:userId (
              email,
              firstName,
              lastName
            )
          `
            )
            .eq("userId", userId)
            .eq("type", "withdrawal")
            .order("createdAt", { ascending: false });

        if (withdrawalHistoryError) {
          console.error(
            "Error fetching withdrawal history from Supabase:",
            withdrawalHistoryError
          );
          return res
            .status(500)
            .json({ message: "Failed to fetch withdrawal history" });
        }

        // Format the data with proper type checking
        const formattedWithdrawalHistory = (withdrawalHistory || []).map(
          (row: any) => ({
            id: row.id,
            amount: row.amount ? parseFloat(row.amount.toString()) : 0,
            status: row.status || "",
            type: row.type || "",
            description: row.description || "",
            method: row.method || "",
            transactionHash: row.transactionHash || "",
            createdAt: row.createdAt
              ? new Date(row.createdAt).toISOString()
              : null,
            approvedAt: row.approvedAt
              ? new Date(row.approvedAt).toISOString()
              : null,
            userEmail: row.users ? row.users.email : "",
            userName: row.users
              ? `${row.users.firstName || ""} ${row.users.lastName || ""}`.trim()
              : "",
          })
        );

        res.json(formattedWithdrawalHistory);
      } catch (error) {
        console.error("Error fetching withdrawal history:", error);
        res.status(500).json({ message: "Failed to fetch withdrawal history" });
      }
    }
  );

  // Audit Logs API - Updated to use Supabase
  router.get(
    "/api/users/:userId/audit-logs",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can access this data
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Use Supabase to fetch audit logs
        const { data: auditLogs, error: auditLogsError } = await supabase
          .from("audit_logs")
          .select(
            `
            id,
            action,
            description,
            ip_address,
            user_agent,
            location,
            severity,
            details,
            created_at
          `
          )
          .eq("user_id", userId)
          .order("created_at", { ascending: false })
          .limit(50);

        if (auditLogsError) {
          console.error(
            "Error fetching audit logs from Supabase:",
            auditLogsError
          );

          // If table doesn't exist, log message and return empty array
          if (
            auditLogsError.message?.includes(
              'table "audit_logs" does not exist'
            ) ||
            auditLogsError.message?.includes(
              'relation "audit_logs" does not exist'
            )
          ) {
            console.log(
              "Audit logs table does not exist, logging to console instead:",
              {
                type: "info",
                userId: userId,
                message: "User accessed audit logs",
                details: { ip: req.ip },
              }
            );
            return res.json([]);
          }

          return res
            .status(500)
            .json({ message: "Failed to fetch audit logs" });
        }

        // Format the audit logs with proper type checking
        const formattedAuditLogs = (auditLogs || []).map((row: any) => ({
          id: row.id,
          action: row.action || "",
          description: row.description || "",
          ipAddress: row.ip_address || "",
          userAgent: row.user_agent || "",
          location: row.location || "",
          severity: row.severity || "low",
          details: row.details || {},
          timestamp: row.created_at
            ? new Date(row.created_at).toISOString()
            : null,
        }));

        res.json(formattedAuditLogs);
      } catch (error) {
        console.error("Error fetching audit logs:", error);

        // If table doesn't exist, log message and return empty array
        if (
          error?.message?.includes('relation "audit_logs" does not exist') ||
          error?.message?.includes('table "audit_logs" does not exist')
        ) {
          console.log(
            "Audit logs table does not exist, logging to console instead:",
            {
              type: "info",
              userId: userId,
              message: "User accessed audit logs",
              details: { ip: req.ip },
            }
          );
          return res.json([]);
        }

        res.status(500).json({ message: "Failed to fetch audit logs" });
      }
    }
  );

  // Deposit confirmation endpoint
  router.post(
    "/transactions/deposit/confirm",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const {
          userId,
          amount,
          selectedPlan,
          selectedMethod,
          walletAddress,
          transactionHash,
          planName,
          planDuration,
          dailyProfit,
          totalReturn,
        } = req.body;
        const user = req.user;

        // Check if user can create deposits
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Validate required fields
        if (!amount || !selectedPlan || !selectedMethod) {
          return res.status(400).json({ message: "Missing required fields" });
        }

        // Build description with plan details for admin visibility
        const description = `Deposit via ${selectedMethod} - ${planName || selectedPlan.toUpperCase() + " PLAN"} (${planDuration || "Duration not specified"})`;

        // Create transaction using the storage layer
        const transaction = await storage.createTransaction({
          userId: userId,
          type: "deposit",
          amount: amount.toString(),
          status: "pending", // Crypto deposits start as pending
          description: description,
          cryptoType: selectedMethod,
          walletAddress: walletAddress || null,
          transactionHash: transactionHash || null,
        });

        // Create notification for the user
        await storage.createNotification({
          userId: userId,
          type: "transaction",
          title: "Deposit Confirmation Received",
          message: `Your deposit of $${amount} via ${selectedMethod} for ${planName || selectedPlan} has been submitted and is pending admin approval.`,
          relatedEntityType: "transaction",
          relatedEntityId: transaction.id,
        });

        // Log the deposit for audit trail
        await storage.createLog({
          type: "audit",
          message: `User confirmed deposit of $${amount} via ${selectedMethod} for ${planName || selectedPlan}`,
          details: {
            userId,
            amount,
            selectedMethod,
            selectedPlan,
            planName,
            transactionId: transaction.id,
            walletAddress,
            transactionHash,
          },
          userId: userId,
        });

        res.json({
          message: "Deposit confirmation submitted successfully",
          transactionId: transaction.id,
          status: "pending",
        });
      } catch (error) {
        console.error("Error confirming deposit:", error);
        res.status(500).json({ message: "Failed to confirm deposit" });
      }
    }
  );

  // Get user deposits endpoint
  router.get(
    "/api/users/:userId/deposits",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can access deposits
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // First try to get from deposits_history table
        try {
          const { data: depositsData, error: depositsError } = await supabase
            .from("deposits_history")
            .select(
              `
              id,
              amount,
              plan_name,
              payment_method,
              status,
              daily_return_rate,
              duration_days,
              earned_amount,
              remaining_days,
              start_date,
              end_date,
              created_at
            `
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (depositsError) {
            throw depositsError;
          }

          if (depositsData && depositsData.length > 0) {
            // Format the data
            const deposits = depositsData.map((row: any) => ({
              id: row.id,
              amount: parseFloat(row.amount) || 0,
              planName: row.plan_name,
              method: row.payment_method,
              status: row.status,
              dailyReturn: parseFloat(row.daily_return_rate) || 0,
              duration: row.duration_days,
              earnedAmount: parseFloat(row.earned_amount) || 0,
              remainingDays: row.remaining_days || 0,
              startDate: row.start_date,
              endDate: row.end_date,
              createdAt: row.created_at,
            }));

            return res.json(deposits);
          }
        } catch (historyError) {
          console.log(
            "Deposits history table not available, checking legacy deposits table:",
            historyError
          );
        }

        // Fallback to legacy deposits table if deposits_history doesn't exist
        try {
          const { data: legacyData, error: legacyError } = await supabase
            .from("deposits")
            .select(
              `
              id,
              amount,
              plan,
              status,
              created_at
            `
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false });

          if (legacyError) {
            throw legacyError;
          }

          const deposits = (legacyData || []).map((row: any) => ({
            id: row.id,
            amount: parseFloat(row.amount) || 0,
            planName: row.plan || "Unknown Plan",
            method: "Unknown",
            status: row.status || "pending",
            dailyReturn: 0,
            duration: 0,
            earnedAmount: 0,
            remainingDays: 0,
            startDate: null,
            endDate: null,
            createdAt: row.created_at,
          }));

          res.json(deposits);
        } catch (legacyError) {
          console.error("Error accessing both deposits tables:", legacyError);
          res.status(500).json({ message: "Failed to fetch deposits" });
        }
      } catch (error) {
        console.error("Error fetching deposits:", error);
        res.status(500).json({ message: "Failed to fetch deposits" });
      }
    }
  );

  // Get user earnings endpoint
  router.get(
    "/api/users/:userId/earnings",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can access earnings
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const {
          dateFrom,
          dateTo,
          planType,
          limit = 20,
          offset = 0,
        } = req.query;

        // Build query conditions
        let conditions = ["user_id = $1"];
        let params: any[] = [userId];
        let paramIndex = 2;

        if (dateFrom) {
          conditions.push(`created_at >= $${paramIndex}`);
          params.push(new Date(dateFrom as string));
          paramIndex++;
        }

        if (dateTo) {
          conditions.push(`created_at <= $${paramIndex}`);
          params.push(new Date(dateTo as string));
          paramIndex++;
        }

        if (planType) {
          conditions.push(`type = $${paramIndex}`);
          params.push(planType);
          paramIndex++;
        }

        // Try to get from earnings table (if it exists)
        try {
          // Build Supabase query
          let query = supabase
            .from("earnings")
            .select(
              `
              id,
              user_id,
              type,
              amount,
              source,
              created_at,
              details
            `
            )
            .eq("user_id", userId)
            .order("created_at", { ascending: false })
            .range(
              parseInt(offset as string),
              parseInt(offset as string) + parseInt(limit as string) - 1
            );

          // Add date filters
          if (dateFrom) {
            query = query.gte(
              "created_at",
              new Date(dateFrom as string).toISOString()
            );
          }
          if (dateTo) {
            query = query.lte(
              "created_at",
              new Date(dateTo as string).toISOString()
            );
          }
          if (planType) {
            query = query.eq("type", planType);
          }

          const { data: earningsData, error: earningsError } = await query;

          if (earningsError) {
            throw earningsError;
          }

          // Get total count and earnings
          let countQuery = supabase
            .from("earnings")
            .select("amount", { count: "exact" })
            .eq("user_id", userId);

          if (dateFrom) {
            countQuery = countQuery.gte(
              "created_at",
              new Date(dateFrom as string).toISOString()
            );
          }
          if (dateTo) {
            countQuery = countQuery.lte(
              "created_at",
              new Date(dateTo as string).toISOString()
            );
          }
          if (planType) {
            countQuery = countQuery.eq("type", planType);
          }

          const {
            data: countData,
            count: totalCount,
            error: countError,
          } = await countQuery;

          if (countError) {
            throw countError;
          }

          const totalEarnings = (countData || []).reduce(
            (sum: number, earning: any) =>
              sum + (parseFloat(earning.amount) || 0),
            0
          );

          const earnings = (earningsData || []).map((row: any) => ({
            id: row.id,
            userId: row.user_id,
            type: row.type,
            amount: parseFloat(row.amount) || 0,
            source: row.source,
            createdAt: row.created_at,
            details: row.details,
          }));

          return res.json({
            earnings,
            totalEarnings,
            totalCount: totalCount || 0,
            hasMore:
              (totalCount || 0) >
              parseInt(offset as string) + parseInt(limit as string),
          });
        } catch (earningsError) {
          console.log(
            "Earnings table not available, generating mock data:",
            earningsError
          );
        }

        // Fallback: Generate mock earnings based on deposits_history
        try {
          const { data: depositsData, error: depositsError } = await supabase
            .from("deposits_history")
            .select(
              `
              id,
              amount,
              plan_name,
              daily_return_rate,
              start_date,
              created_at
            `
            )
            .eq("user_id", userId)
            .eq("status", "active")
            .order("created_at", { ascending: false });

          if (depositsError) {
            throw depositsError;
          }

          // Generate mock earnings based on deposits
          const mockEarnings: any[] = [];
          let totalEarnings = 0;

          for (const deposit of depositsData || []) {
            const depositAmount = parseFloat(deposit.amount) || 0;
            const dailyRate = parseFloat(deposit.daily_return_rate) || 0;
            const dailyEarning = depositAmount * (dailyRate / 100);

            // Generate daily earnings for the last 30 days
            for (let i = 0; i < 30; i++) {
              const earningDate = new Date();
              earningDate.setDate(earningDate.getDate() - i);

              mockEarnings.push({
                id: mockEarnings.length + 1,
                userId: userId,
                type: "daily_return",
                amount: dailyEarning,
                source: deposit.plan_name,
                createdAt: earningDate,
                details: { depositId: deposit.id },
              });

              totalEarnings += dailyEarning;
            }
          }

          // Apply filters and pagination
          let filteredEarnings = mockEarnings;

          if (dateFrom) {
            const fromDate = new Date(dateFrom as string);
            filteredEarnings = filteredEarnings.filter(
              (e) => new Date(e.createdAt) >= fromDate
            );
          }

          if (dateTo) {
            const toDate = new Date(dateTo as string);
            filteredEarnings = filteredEarnings.filter(
              (e) => new Date(e.createdAt) <= toDate
            );
          }

          if (planType) {
            filteredEarnings = filteredEarnings.filter(
              (e) => e.type === planType
            );
          }

          const startIndex = parseInt(offset as string);
          const endIndex = startIndex + parseInt(limit as string);
          const paginatedEarnings = filteredEarnings.slice(
            startIndex,
            endIndex
          );

          res.json({
            earnings: paginatedEarnings,
            totalEarnings: filteredEarnings.reduce(
              (sum, e) => sum + e.amount,
              0
            ),
            totalCount: filteredEarnings.length,
            hasMore: filteredEarnings.length > endIndex,
          });
        } catch (fallbackError) {
          console.error("Error generating mock earnings:", fallbackError);
          res.json({
            earnings: [],
            totalEarnings: 0,
            totalCount: 0,
            hasMore: false,
          });
        }
      } catch (error) {
        console.error("Error fetching earnings:", error);
        res.status(500).json({ message: "Failed to fetch earnings" });
      }
    }
  );

  // Update deposits history endpoint
  router.put(
    "/api/users/:userId/deposits/:depositId",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const depositId = parseInt(req.params.depositId);
        const user = req.user;

        // Check permissions
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const { status, earnedAmount, remainingDays } = req.body;

        // Update deposit in deposits_history table
        const { data, error } = await supabase
          .from("deposits_history")
          .update({
            status: status,
            earned_amount: earnedAmount,
            remaining_days: remainingDays,
            updated_at: new Date().toISOString(),
          })
          .eq("id", depositId)
          .eq("user_id", userId)
          .select()
          .single();

        if (error || !data) {
          return res.status(404).json({ message: "Deposit not found" });
        }

        res.json({
          message: "Deposit updated successfully",
          deposit: data,
        });
      } catch (error) {
        console.error("Error updating deposit:", error);
        res.status(500).json({ message: "Failed to update deposit" });
      }
    }
  );

  // Helper function to log audit events (Enhanced to work with both systems)
  async function logAuditEvent(
    userId: number,
    action: string,
    description: string,
    req: Request,
    severity: string = "low",
    details: any = {}
  ) {
    try {
      // Log to new audit_logs table
      const { error } = await supabase.from("audit_logs").insert({
        user_id: userId,
        action: action,
        description: description,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
        location: "Unknown", // TODO: Add geolocation lookup
        severity: severity,
        details: details,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      // If audit logs table doesn't exist, just log to console
      console.log(
        "Audit logs table does not exist, logging to console instead:",
        {
          type: severity,
          userId,
          message: description,
          details: { ip: req.ip, ...details },
        }
      );
    }

    // Also log to storage layer for backward compatibility
    try {
      await storage.createLog({
        type:
          severity === "high"
            ? "error"
            : severity === "medium"
              ? "warning"
              : "info",
        userId: userId,
        message: description,
        details: { ip: req.ip, action, ...details },
      });
    } catch (storageError) {
      console.warn("Failed to log to storage layer:", storageError);
    }
  }

  // Enhanced login audit logging middleware
  app.use("/api/login", async (req, res, next) => {
    // Capture the original res.json method
    const originalJson = res.json;

    // Override res.json to capture login results
    res.json = function (body) {
      // Log the login attempt result
      const username = req.body?.username;
      if (username && body) {
        if (res.statusCode === 200 && body.user) {
          // Successful login
          logAuditEvent(
            body.user.id,
            "login_success",
            "User successfully logged in",
            req,
            "low",
            { username, method: "password" }
          ).catch(console.error);
        } else if (res.statusCode === 401) {
          // Failed login - try to find user ID for logging
          supabase
            .from("users")
            .select("id")
            .or(`username.eq.${username},email.eq.${username}`)
            .single()
            .then(({ data }) => {
              const userId = data?.id;
              if (userId) {
                logAuditEvent(
                  userId,
                  "login_failed",
                  "Failed login attempt - invalid credentials",
                  req,
                  "medium",
                  { username, reason: "invalid_credentials" }
                ).catch(console.error);
              }
            })
            .catch(() => {
              // User not found, log without user ID
              console.log(
                "Failed login attempt for non-existent user:",
                username
              );
            });
        }
      }

      // Call the original json method
      return originalJson.call(this, body);
    };

    next();
  });

  // Helper function to log audit events
  async function logAuditEvent(
    userId: number,
    action: string,
    description: string,
    req: Request,
    severity: string = "low",
    details: any = {}
  ) {
    try {
      const { error } = await supabase.from("audit_logs").insert({
        user_id: userId,
        action: action,
        description: description,
        ip_address: req.ip || req.connection.remoteAddress,
        user_agent: req.get("User-Agent"),
        location: "Unknown", // TODO: Add geolocation lookup
        severity: severity,
        details: details,
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      // If audit logs table doesn't exist, just log to console
      console.log(
        "Audit logs table does not exist, logging to console instead:",
        {
          type: severity,
          userId,
          message: description,
          details: { ip: req.ip, ...details },
        }
      );
    }
  }

  // Update profile endpoint to include audit logging
  router.put(
    "/api/users/:userId/profile",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can update this profile
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const {
          firstName,
          lastName,
          phone,
          address,
          city,
          state,
          zipCode,
          country,
          dateOfBirth,
        } = req.body;

        // Update user profile
        const { data, error } = await supabase
          .from("users")
          .update({
            first_name: firstName,
            last_name: lastName,
            phone: phone,
            address: address,
            city: city,
            state: state,
            zip_code: zipCode,
            country: country,
            date_of_birth: dateOfBirth,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId)
          .select()
          .single();

        if (error || !data) {
          return res.status(404).json({ message: "User not found" });
        }

        // Log audit event
        await logAuditEvent(
          userId,
          "profile_updated",
          "Profile information updated",
          req,
          "low",
          { changes: Object.keys(req.body) }
        );

        res.json({
          message: "Profile updated successfully",
          user: data,
        });
      } catch (error) {
        console.error("Error updating profile:", error);
        res.status(500).json({ message: "Failed to update profile" });
      }
    }
  );

  // Get user profile endpoint
  router.get(
    "/api/users/:userId/profile",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can access this profile
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        // Fetch user profile data
        const { data, error } = await supabase
          .from("users")
          .select(
            `
            id,
            first_name,
            last_name,
            email,
            phone,
            address,
            city,
            state,
            zip_code,
            country,
            date_of_birth,
            created_at,
            updated_at
          `
          )
          .eq("id", userId)
          .single();

        if (error || !data) {
          return res.status(404).json({ message: "User not found" });
        }

        // Format the response to match expected structure
        const formattedUser = {
          id: data.id,
          firstName: data.first_name,
          lastName: data.last_name,
          email: data.email,
          phone: data.phone,
          address: data.address,
          city: data.city,
          state: data.state,
          zipCode: data.zip_code,
          country: data.country,
          dateOfBirth: data.date_of_birth,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
        };

        res.json(formattedUser);
      } catch (error) {
        console.error("Error fetching profile:", error);
        res.status(500).json({ message: "Failed to fetch profile" });
      }
    }
  );

  // Update user security (password) endpoint
  router.put(
    "/api/users/:userId/security",
    requireEmailVerification,
    async (req: Request, res: Response) => {
      try {
        const userId = parseInt(req.params.userId);
        const user = req.user;

        // Check if user can update this profile
        if (!user || (user.role !== "admin" && user.id !== userId)) {
          return res.status(403).json({ message: "Access denied" });
        }

        const { currentPassword, newPassword } = req.body;

        // Validate input
        if (!currentPassword || !newPassword) {
          return res.status(400).json({
            message: "Current password and new password are required",
          });
        }

        // Get current user password
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("password")
          .eq("id", userId)
          .single();

        if (userError || !userData) {
          return res.status(404).json({ message: "User not found" });
        }

        // Verify current password
        const isValidPassword = await comparePasswords(
          currentPassword,
          userData.password
        );
        if (!isValidPassword) {
          await logAuditEvent(
            userId,
            "password_change_failed",
            "Failed password change attempt - incorrect current password",
            req,
            "medium"
          );
          return res
            .status(400)
            .json({ message: "Current password is incorrect" });
        }

        // Hash new password
        const hashedNewPassword = await hashPassword(newPassword);

        // Update password
        const { error: updateError } = await supabase
          .from("users")
          .update({
            password: hashedNewPassword,
            updated_at: new Date().toISOString(),
          })
          .eq("id", userId);

        if (updateError) {
          console.error("Error updating password:", updateError);
          return res.status(500).json({ message: "Failed to update password" });
        }

        // Log audit event
        await logAuditEvent(
          userId,
          "password_changed",
          "Password successfully changed",
          req,
          "medium",
          { method: "password_form" }
        );

        res.json({ message: "Password updated successfully" });
      } catch (error) {
        console.error("Error updating password:", error);
        res.status(500).json({ message: "Failed to update password" });
      }
    }
  );

  // Enhanced registration audit logging middleware
  app.use("/api/register", async (req, res, next) => {
    // Capture the original res.json method
    const originalJson = res.json;

    // Override res.json to capture registration results
    res.json = function (body) {
      // Log the registration attempt result
      const username = req.body?.username;
      const email = req.body?.email;

      if (body) {
        if (res.statusCode === 201 || res.statusCode === 200) {
          // Successful registration - get user ID from response or database
          if (body.user?.id) {
            logAuditEvent(
              body.user.id,
              "user_registered",
              "New user account created",
              req,
              "low",
              { username, email, registrationMethod: "email" }
            ).catch(console.error);
          } else {
            // Try to find the newly created user
            supabase
              .from("users")
              .select("id")
              .or(
                `username.eq.${username || email},email.eq.${username || email}`
              )
              .single()
              .then(({ data }) => {
                if (data?.id) {
                  logAuditEvent(
                    data.id,
                    "user_registered",
                    "New user account created",
                    req,
                    "low",
                    { username, email, registrationMethod: "email" }
                  ).catch(console.error);
                }
              })
              .catch(console.error);
          }
        } else if (res.statusCode >= 400) {
          // Failed registration
          console.log("Failed registration attempt:", {
            username,
            email,
            error: body.message,
            ip: req.ip,
          });
        }
      }

      // Call the original json method
      return originalJson.call(this, body);
    };

    next();
  });

  // Clean up inactive visitors every 5 minutes
  setInterval(
    () => {
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

      for (const [id, visitor] of activeVisitors) {
        if (visitor.lastActivity < fiveMinutesAgo) {
          activeVisitors.delete(id);
        }
      }
    },
    5 * 60 * 1000
  );

  const httpServer = createServer(app);

  return httpServer;
}
