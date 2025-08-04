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
    // First try to get user data including balance
    const { data: userData, error: userError } = await supabase
      .from("users")
      .select("balance, pending_balance")
      .eq("id", userId)
      .single();

    if (userError) {
      console.error("Error fetching user data:", userError);
      return null;
    }

    // Next, get deposit and withdrawal data to calculate total balance
    const { data: deposits, error: depositError } = await supabase
      .from("deposits")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "approved");

    const { data: withdrawals, error: withdrawalError } = await supabase
      .from("withdrawals")
      .select("amount")
      .eq("user_id", userId)
      .eq("status", "approved");

    if (depositError || withdrawalError) {
      console.error(
        "Error fetching transaction data:",
        depositError || withdrawalError
      );
    }

    // Calculate totals
    const totalDeposits =
      deposits?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) || 0;
    const totalWithdrawals =
      withdrawals?.reduce((sum, item) => sum + (Number(item.amount) || 0), 0) ||
      0;

    // Calculate available and total balance
    const availableBalance = userData?.balance || 0;
    const pendingBalance = userData?.pending_balance || 0;
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
