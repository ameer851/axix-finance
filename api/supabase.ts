import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables (lazily, without throwing at import time)
const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

// Create Supabase client only if configured; avoid throwing during cold start so non-DB routes (e.g., /api/ping) still work
export const supabase = isSupabaseConfigured
  ? createClient(supabaseUrl, supabaseKey)
  : (null as any);

// Function to get user balance
export async function getUserBalance(userId: string | number) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase not configured");
    }
    // Get user data including balance and profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(
        `
        id,
        balance,
        profiles (
          is_verified
        )
      `
      )
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      throw new Error("Failed to fetch user data");
    }

    // Determine verification status (do not block balance fetch if unverified)
    const profile = Array.isArray(userData.profiles)
      ? userData.profiles[0]
      : userData.profiles;
    const isVerified = !!profile?.is_verified;

    // Get pending transactions to calculate pending balance
    const { data: pendingTxns, error: pendingError } = await supabase
      .from("transactions")
      .select("amount, type, status")
      .eq("user_id", userId)
      .eq("status", "pending");

    if (pendingError) {
      console.error("Error fetching pending transactions:", pendingError);
    }

    // Calculate pending balance from transactions
    const pendingBalance =
      pendingTxns?.reduce((sum: number, txn: { amount: any; type: string }) => {
        const amount = Number((txn as any).amount) || 0;
        // Add deposits, subtract withdrawals
        return sum + ((txn as any).type === "deposit" ? amount : -amount);
      }, 0) || 0;

    // Get available balance from user data
    const availableBalance = Number(userData?.balance || 0);
    const totalBalance = availableBalance + pendingBalance;

    return {
      availableBalance,
      pendingBalance,
      totalBalance,
      lastUpdated: new Date().toISOString(),
      // Extra metadata for clients that care; ignored by others
      requiresVerification: !isVerified,
    };
  } catch (error) {
    console.error("Error in getUserBalance function:", error);
    // Do not hard fail balance fetch; return a safe default
    return {
      availableBalance: 0,
      pendingBalance: 0,
      totalBalance: 0,
      lastUpdated: new Date().toISOString(),
      requiresVerification: true,
    } as any;
  }
}

// Admin functions for deposits and withdrawals
export async function getAdminDeposits(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    let query = supabase.from("deposits").select("*", { count: "exact" });

    // Apply filters if provided
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }
    if (filters?.amountMin) {
      query = query.gte("amount", filters.amountMin);
    }
    if (filters?.amountMax) {
      query = query.lte("amount", filters.amountMax);
    }

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching admin deposits:", error);
      return null;
    }

    return {
      deposits: data || [],
      totalDeposits: count || 0,
      currentPage: 1,
      totalPages: 1,
    };
  } catch (error) {
    console.error("Error in getAdminDeposits function:", error);
    return null;
  }
}

export async function getAdminWithdrawals(filters?: {
  status?: string;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
}) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    let query = supabase.from("withdrawals").select("*", { count: "exact" });

    // Apply filters if provided
    if (filters?.status) {
      query = query.eq("status", filters.status);
    }
    if (filters?.dateFrom) {
      query = query.gte("created_at", filters.dateFrom);
    }
    if (filters?.dateTo) {
      query = query.lte("created_at", filters.dateTo);
    }
    if (filters?.amountMin) {
      query = query.gte("amount", filters.amountMin);
    }
    if (filters?.amountMax) {
      query = query.lte("amount", filters.amountMax);
    }

    // Order by created_at desc
    query = query.order("created_at", { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      console.error("Error fetching admin withdrawals:", error);
      return null;
    }

    return {
      withdrawals: data || [],
      totalWithdrawals: count || 0,
      currentPage: 1,
      totalPages: 1,
    };
  } catch (error) {
    console.error("Error in getAdminWithdrawals function:", error);
    return null;
  }
}

export async function approveDeposit(depositId: string) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return false;
    }
    const { error } = await supabase.rpc("approve_deposit", {
      p_deposit_id: depositId,
    });

    if (error) {
      console.error("Error approving deposit:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in approveDeposit function:", error);
    return false;
  }
}

export async function approveWithdrawal(withdrawalId: string) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return false;
    }
    const { error } = await supabase.rpc("approve_withdrawal", {
      p_withdrawal_id: withdrawalId,
    });

    if (error) {
      console.error("Error approving withdrawal:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error in approveWithdrawal function:", error);
    return false;
  }
}

// Function to get user deposits
export async function getUserDeposits(userId: string | number) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    const { data, error } = await supabase
      .from("deposits")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user deposits:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserDeposits function:", error);
    return null;
  }
}

// Function to get user withdrawals
export async function getUserWithdrawals(userId: string | number) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    const { data, error } = await supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user withdrawals:", error);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error in getUserWithdrawals function:", error);
    return null;
  }
}

// Admin Functions
export async function getAdminDashboardData() {
  try {
    if (!isSupabaseConfigured || !supabase) {
      throw new Error("Supabase not configured");
    }
    // Get users count
    const { count: usersCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: "exact" });

    if (usersError) throw usersError;

    // Get visitors count (from audit_logs)
    const { count: visitorsCount, error: visitorsError } = await supabase
      .from("audit_logs")
      .select("*", { count: "exact" })
      .eq("action", "visit");

    if (visitorsError) throw visitorsError;

    // Get recent withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select(
        `
        *,
        users (
          email,
          profiles (
            full_name
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (withdrawalsError) throw withdrawalsError;

    // Get recent deposits
    const { data: deposits, error: depositsError } = await supabase
      .from("deposits")
      .select(
        `
        *,
        users (
          email,
          profiles (
            full_name
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(10);

    if (depositsError) throw depositsError;

    // Get recent audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from("audit_logs")
      .select(
        `
        *,
        users (
          email,
          profiles (
            full_name
          )
        )
      `
      )
      .order("created_at", { ascending: false })
      .limit(20);

    if (auditError) throw auditError;

    return {
      usersCount: usersCount || 0,
      visitorsCount: visitorsCount || 0,
      withdrawals,
      deposits,
      auditLogs,
    };
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    throw error;
  }
}

// Function to create a new deposit
export async function createDeposit(
  userId: string | number,
  amount: number,
  method: string,
  reference: string
) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    const { data, error } = await supabase
      .from("deposits")
      .insert([
        {
          user_id: userId,
          amount,
          method,
          reference,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error creating deposit:", error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error in createDeposit function:", error);
    return null;
  }
}

// Function to create a new withdrawal
export async function createWithdrawal(
  userId: string | number,
  amount: number,
  method: string,
  address: string
) {
  try {
    if (!isSupabaseConfigured || !supabase) {
      return null;
    }
    const { data, error } = await supabase
      .from("withdrawals")
      .insert([
        {
          user_id: userId,
          amount,
          method,
          address,
          status: "pending",
          created_at: new Date().toISOString(),
        },
      ])
      .select();

    if (error) {
      console.error("Error creating withdrawal:", error);
      return null;
    }

    return data[0];
  } catch (error) {
    console.error("Error in createWithdrawal function:", error);
    return null;
  }
}
