#!/usr/bin/env node

/**
 * This script checks the current state of investments in the database
 * to help diagnose issues with the automatic investment system
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Get directory path
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, "../.env") });

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error(
    "❌ Missing Supabase configuration. Please check your .env file."
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

/**
 * Check the current state of investments
 */
async function checkInvestments() {
  console.log("🔍 Checking Investment System Status");
  console.log("===================================");

  try {
    // 1. Check for active investments
    console.log("\n1️⃣ Active Investments");
    const { data: activeInvestments, error: activeError } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "active");

    if (activeError) {
      console.error("❌ Error fetching active investments:", activeError);
    } else {
      console.log(`Found ${activeInvestments?.length || 0} active investments`);

      if (activeInvestments && activeInvestments.length > 0) {
        for (const inv of activeInvestments) {
          const firstProfitDate = inv.first_profit_date
            ? new Date(inv.first_profit_date)
            : null;
          const lastReturnApplied = inv.last_return_applied
            ? new Date(inv.last_return_applied)
            : null;

          console.log(`\n📊 Investment #${inv.id}:`);
          console.log(`   User ID: ${inv.user_id}`);
          console.log(`   Plan: ${inv.plan_name}`);
          console.log(`   Principal: $${inv.principal_amount}`);
          console.log(
            `   Start date: ${new Date(inv.start_date).toLocaleDateString()}`
          );
          console.log(
            `   End date: ${new Date(inv.end_date).toLocaleDateString()}`
          );
          console.log(`   Days elapsed: ${inv.days_elapsed}`);
          console.log(`   Total earned: $${inv.total_earned}`);
          console.log(
            `   First profit date: ${firstProfitDate ? firstProfitDate.toLocaleDateString() : "Not set"}`
          );
          console.log(
            `   Last return applied: ${lastReturnApplied ? lastReturnApplied.toLocaleDateString() : "Never"}`
          );

          // Check if investment should receive returns today
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const shouldReceiveFirstProfit =
            firstProfitDate && firstProfitDate.getTime() <= today.getTime();

          const shouldReceiveDailyReturn =
            !lastReturnApplied ||
            new Date(lastReturnApplied).toDateString() !== today.toDateString();

          console.log(
            `   Should receive first profit today: ${shouldReceiveFirstProfit ? "YES" : "NO"}`
          );
          console.log(
            `   Should receive daily return today: ${shouldReceiveDailyReturn ? "YES" : "NO"}`
          );
        }
      }
    }

    // 2. Check recent investment returns
    console.log("\n2️⃣ Recent Investment Returns");
    const { data: returns, error: returnsError } = await supabase
      .from("investment_returns")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(5);

    if (returnsError) {
      console.error("❌ Error fetching investment returns:", returnsError);
    } else {
      console.log(`Found ${returns?.length || 0} recent returns`);

      if (returns && returns.length > 0) {
        for (const ret of returns) {
          console.log(
            `   Return ID: ${ret.id}, Investment: ${ret.investment_id}, Amount: $${ret.amount}, Date: ${new Date(ret.return_date).toLocaleDateString()}`
          );
        }
      }
    }

    // 3. Check the cron job status
    console.log("\n3️⃣ Checking Cron Job Status");
    console.log("Fly.io cron job status must be checked in Fly.io dashboard");
    console.log("Command to check: fly machines list --app axix-finance");

    // 4. Print next steps
    console.log("\n✅ Investment System Check Complete");
    console.log("\nPossible issues:");
    console.log("1. No active investments found (create a new investment)");
    console.log(
      "2. First profit date not set correctly (check admin approval process)"
    );
    console.log("3. Cron job not running (check Fly.io dashboard)");
    console.log("4. All returns already applied today (wait until tomorrow)");

    console.log("\nFix recommendations:");
    console.log(
      "1. Verify cron job setup: 'fly machines list --app axix-finance'"
    );
    console.log("2. Recreate cron job: Run 'scripts/setup-fly-cron.ps1'");
    console.log(
      "3. Test processor manually: 'node scripts/auto-investment-processor.js'"
    );
  } catch (error) {
    console.error("💥 Error checking investment system:", error);
  }
}

// Run the check
checkInvestments();
