import { createClient } from "@supabase/supabase-js";

// Initialize Supabase client using environment variables
const supabaseUrl =
  process.env.SUPABASE_URL || "https://wvnyiinrmfysabsfztii.supabase.co";
const supabaseKey =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind2bnlpaW5ybWZ5c2Fic2Z6dGlpIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MzA5NDM2NywiZXhwIjoyMDY4NjcwMzY3fQ.zLhFm0aPCDfbUQHWWdPJeRfXaI06JP1sHzfGdHM0n9g";

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Function to get user balance
export async function getUserBalance(userId: string | number) {
  try {
    // Get user data including balance and profile
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select(`
        id,
        balance,
        profiles (
          is_verified
        )
      `)
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      throw new Error("Failed to fetch user data");
    }

    // Check if user is verified
    // Check if user is verified (profiles is an array but we expect one profile)
    const profile = Array.isArray(userData.profiles) ? userData.profiles[0] : userData.profiles;
    if (!profile?.is_verified) {
      throw new Error("User verification required");
    }

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
      pendingTxns?.reduce((sum, txn) => {
        const amount = Number(txn.amount) || 0;
        // Add deposits, subtract withdrawals
        return sum + (txn.type === "deposit" ? amount : -amount);
      }, 0) || 0;

    // Get available balance from user data
    const availableBalance = Number(userData?.balance || 0);
    const totalBalance = availableBalance + pendingBalance;

    return {
      availableBalance,
      pendingBalance,
      totalBalance,
      lastUpdated: new Date().toISOString(),
    };
  } catch (error) {
    console.error("Error in getUserBalance function:", error);
    return null;
  }
}

// Function to get user deposits
export async function getUserDeposits(userId: string | number) {
  try {
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
    // Get users count
    const { count: usersCount, error: usersError } = await supabase
      .from("users")
      .select("*", { count: 'exact' });

    if (usersError) throw usersError;

    // Get visitors count (from audit_logs)
    const { count: visitorsCount, error: visitorsError } = await supabase
      .from("audit_logs")
      .select("*", { count: 'exact' })
      .eq("action", "visit");

    if (visitorsError) throw visitorsError;

    // Get recent withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabase
      .from("withdrawals")
      .select(`
        *,
        users (
          email,
          profiles (
            full_name
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (withdrawalsError) throw withdrawalsError;

    // Get recent deposits
    const { data: deposits, error: depositsError } = await supabase
      .from("deposits")
      .select(`
        *,
        users (
          email,
          profiles (
            full_name
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(10);

    if (depositsError) throw depositsError;

    // Get recent audit logs
    const { data: auditLogs, error: auditError } = await supabase
      .from("audit_logs")
      .select(`
        *,
        users (
          email,
          profiles (
            full_name
          )
        )
      `)
      .order("created_at", { ascending: false })
      .limit(20);

    if (auditError) throw auditError;

    return {
      usersCount: usersCount || 0,
      visitorsCount: visitorsCount || 0,
      withdrawals,
      deposits,
      auditLogs
    };
  } catch (error) {
    console.error("Error fetching admin dashboard data:", error);
    throw error;
  }
}
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

// Function to create a new deposit
export async function createDeposit(
  userId: string | number,
  amount: number,
  method: string,
  reference: string
) {
  try {
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
