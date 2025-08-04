import { createClient } from "@supabase/supabase-js";
import { Router } from "express";

const adminRouter = Router();
const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Transactions endpoint (used for both deposits and withdrawals)
adminRouter.get("/transactions", async (req, res) => {
  try {
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

// Stats endpoint
adminRouter.get("/stats", async (req, res) => {
  try {
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
      .select("type, status, amount, created_at");

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

// Audit logs endpoint
adminRouter.get("/audit-logs", async (req, res) => {
  try {
    // Get query parameters
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const offset = (page - 1) * limit;
    const action = req.query.action as string;
    const search = req.query.search as string;

    // Build query
    let query = supabase
      .from("audit_logs")
      .select(
        `
        *,
        users!left(id, username, email)
      `,
        { count: "exact" }
      )
      .order("created_at", { ascending: false });

    // Apply filters
    if (action) {
      query = query.eq("action", action);
    }
    if (search) {
      query = query.or(
        `description.ilike.%${search}%,action.ilike.%${search}%`
      );
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: logs, error, count } = await query;

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Failed to fetch audit logs" });
    }

    return res.status(200).json({
      logs: logs || [],
      totalLogs: count || 0,
      page,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (error) {
    console.error("Audit logs fetch error:", error);
    return res.status(500).json({ message: "Failed to fetch audit logs" });
  }
});

// Update transaction status
adminRouter.patch("/transactions/:id/status", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const { data, error } = await supabase
      .from("transactions")
      .update({ status })
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Supabase error:", error);
      return res
        .status(500)
        .json({ message: "Failed to update transaction status" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Update transaction status error:", error);
    return res
      .status(500)
      .json({ message: "Failed to update transaction status" });
  }
});

// Bulk update transaction status
adminRouter.post("/transactions/bulk-status", async (req, res) => {
  try {
    const { ids, status } = req.body;

    const { data, error } = await supabase
      .from("transactions")
      .update({ status })
      .in("id", ids)
      .select();

    if (error) {
      console.error("Supabase error:", error);
      return res.status(500).json({ message: "Failed to update transactions" });
    }

    return res.status(200).json(data);
  } catch (error) {
    console.error("Bulk update transactions error:", error);
    return res.status(500).json({ message: "Failed to update transactions" });
  }
});

export default adminRouter;
