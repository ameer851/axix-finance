// Simple script to add a test pending withdrawal
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL || "",
  process.env.SUPABASE_ANON_KEY || ""
);

async function main() {
  try {
    // Get a user to associate the withdrawal with
    const { data: users, error: userError } = await supabase
      .from("users")
      .select("id")
      .limit(1);

    if (userError || !users || users.length === 0) {
      console.log(
        "No users found in the database. Please create a user first."
      );
      return;
    }

    const userId = users[0].id;

    // Check for existing withdrawals
    const { data: withdrawals, error: withdrawalError } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "withdrawal");

    if (withdrawalError) {
      throw withdrawalError;
    }

    console.log(`Found ${withdrawals.length} withdrawals`);

    // Check for pending withdrawals
    const { data: pendingWithdrawals, error: pendingError } = await supabase
      .from("transactions")
      .select("*")
      .eq("type", "withdrawal")
      .eq("status", "pending");

    if (pendingError) {
      throw pendingError;
    }

    console.log(`Found ${pendingWithdrawals.length} pending withdrawals`);

    // Create a new test withdrawal if none exist
    if (pendingWithdrawals.length === 0) {
      const { error: insertError } = await supabase
        .from("transactions")
        .insert([
          {
            user_id: userId,
            type: "withdrawal",
            amount: 500.0,
            status: "pending",
            description: "Test withdrawal for admin approval",
            created_at: new Date().toISOString(),
          },
        ]);

      if (insertError) {
        throw insertError;
      }

      console.log("Created a new test pending withdrawal");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

main();
