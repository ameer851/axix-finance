require("dotenv").config();

const { createClient } = require("@supabase/supabase-js");

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase environment variables");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser24() {
  try {
    console.log("=== Checking User ID 24 ===\n");

    // Check current user state
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, email, balance, active_deposits")
      .eq("id", 24)
      .single();

    if (userError) {
      console.error("Error fetching user:", userError);
      return;
    }

    console.log(`User ID: ${user.id}`);
    console.log(`Email: ${user.email}`);
    console.log(`Balance: $${user.balance}`);
    console.log(`Active Deposits: $${user.active_deposits || "0"}`);

    // Check if user has any transactions
    const { data: transactions, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("user_id", 24)
      .order("created_at", { ascending: false })
      .limit(5);

    if (txError) {
      console.error("Error fetching transactions:", txError);
    } else {
      console.log(`\nRecent Transactions: ${transactions.length}`);
      if (transactions.length > 0) {
        transactions.forEach((tx) => {
          console.log(
            `- ${tx.type}: $${tx.amount} (${tx.status}) - ${tx.description}`
          );
        });
      }
    }

    // Check if user has any investments
    const { data: investments, error: invError } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", 24)
      .order("created_at", { ascending: false })
      .limit(5);

    if (invError) {
      console.error("Error fetching investments:", invError);
    } else {
      console.log(`\nInvestments: ${investments.length}`);
      if (investments.length > 0) {
        investments.forEach((inv) => {
          console.log(
            `- ${inv.plan_name}: $${inv.principal_amount} (${inv.status})`
          );
        });
      }
    }
  } catch (error) {
    console.error("Test failed:", error);
  }
}

// Run the check
checkUser24();
