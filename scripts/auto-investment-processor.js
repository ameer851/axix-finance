#!/usr/bin/env node

/**
 * Automatic Investment Returns Processor
 *
 * This service automatically applies daily returns to all active investments
 * and handles investment completion. Designed to run as a scheduled task.
 *
 * Usage:
 *   node scripts/auto-investment-processor.js
 *
 * For cron job (daily at 2 AM):
 *   0 2 * * * cd /path/to/project && node scripts/auto-investment-processor.js
 *
 * For testing:
 *   node scripts/auto-investment-processor.js --dry-run
 */

const { createClient } = require("@supabase/supabase-js");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

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

// Check for dry run mode
const isDryRun = process.argv.includes("--dry-run");
if (isDryRun) {
  console.log("🔍 DRY RUN MODE - No changes will be made to the database");
}

/**
 * Apply daily returns to all active investments
 */
async function applyDailyReturns() {
  console.log(
    `🚀 Starting automatic investment returns processing... (${isDryRun ? "DRY RUN" : "LIVE"})`
  );

  try {
    // Get all active investments that haven't received returns today
    const today = new Date().toISOString().split("T")[0];

    const { data: investments, error: investmentsError } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "active")
      .or(`last_return_applied.is.null,last_return_applied.neq.${today}`);

    if (investmentsError) {
      console.error("❌ Error fetching investments:", investmentsError);
      return;
    }

    if (!investments || investments.length === 0) {
      console.log("ℹ️  No active investments found that need returns today.");
      return;
    }

    console.log(`📊 Processing ${investments.length} active investments...`);

    let processedCount = 0;
    let completedCount = 0;
    let totalReturnsApplied = 0;

    for (const investment of investments) {
      try {
        const daysElapsed =
          Math.floor(
            (Date.now() - new Date(investment.start_date).getTime()) /
              (1000 * 60 * 60 * 24)
          ) + 1;

        // Check if investment should be completed
        if (daysElapsed >= investment.plan_duration) {
          if (!isDryRun) {
            // Mark investment as completed
            await supabase
              .from("investments")
              .update({
                status: "completed",
                days_elapsed: investment.plan_duration,
                total_earned: investment.total_return,
                updated_at: new Date().toISOString(),
              })
              .eq("id", investment.id);

            // Create completion record
            await supabase.from("investment_returns").insert({
              investment_id: investment.id,
              user_id: investment.user_id,
              amount: investment.total_return - investment.total_earned,
              return_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });
          }

          console.log(
            `✅ Investment ${investment.id} completed - Total earned: $${investment.total_return}`
          );
          completedCount++;
          continue;
        }

        // Calculate and apply daily return
        const dailyReturn = investment.daily_profit;

        if (!isDryRun) {
          // Apply return to user's balance
          const { data: user } = await supabase
            .from("users")
            .select("balance")
            .eq("id", investment.user_id)
            .single();

          if (user) {
            const currentBalance = parseFloat(user.balance || "0");
            const newBalance = currentBalance + dailyReturn;

            await supabase
              .from("users")
              .update({ balance: newBalance.toString() })
              .eq("id", investment.user_id);

            // Update investment record
            await supabase
              .from("investments")
              .update({
                days_elapsed: daysElapsed,
                total_earned: investment.total_earned + dailyReturn,
                last_return_applied: today,
                updated_at: new Date().toISOString(),
              })
              .eq("id", investment.id);

            // Create return record
            await supabase.from("investment_returns").insert({
              investment_id: investment.id,
              user_id: investment.user_id,
              amount: dailyReturn,
              return_date: new Date().toISOString(),
              created_at: new Date().toISOString(),
            });
          }
        }

        console.log(
          `💰 Applied $${dailyReturn.toFixed(2)} return to investment ${investment.id} (Day ${daysElapsed}/${investment.plan_duration})`
        );
        processedCount++;
        totalReturnsApplied += dailyReturn;
      } catch (error) {
        console.error(
          `❌ Error processing investment ${investment.id}:`,
          error
        );
      }
    }

    console.log(`\n📈 Processing Summary:`);
    console.log(`   • Investments processed: ${processedCount}`);
    console.log(`   • Investments completed: ${completedCount}`);
    console.log(
      `   • Total returns applied: $${totalReturnsApplied.toFixed(2)}`
    );
    console.log(
      `   • Mode: ${isDryRun ? "DRY RUN (no changes made)" : "LIVE (changes applied)"}`
    );

    // Send summary notification (if configured)
    if (!isDryRun && processedCount > 0) {
      await sendProcessingSummary(
        processedCount,
        completedCount,
        totalReturnsApplied
      );
    }
  } catch (error) {
    console.error("❌ Fatal error in daily returns processing:", error);
    process.exit(1);
  }
}

/**
 * Send processing summary notification
 */
async function sendProcessingSummary(
  processedCount,
  completedCount,
  totalReturns
) {
  try {
    // This could be extended to send email notifications or Discord webhooks
    console.log(
      `📧 Processing summary notification sent (processed: ${processedCount}, completed: ${completedCount}, returns: $${totalReturns.toFixed(2)})`
    );
  } catch (error) {
    console.warn("⚠️  Failed to send processing summary:", error);
  }
}

/**
 * Clean up old completed investments (optional maintenance)
 */
async function cleanupOldInvestments() {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    if (!isDryRun) {
      const { data, error } = await supabase
        .from("investment_returns")
        .delete()
        .lt("created_at", thirtyDaysAgo.toISOString());

      if (!error && data) {
        console.log(`🧹 Cleaned up ${data.length} old return records`);
      }
    } else {
      console.log(
        `🔍 DRY RUN: Would clean up old return records older than ${thirtyDaysAgo.toISOString()}`
      );
    }
  } catch (error) {
    console.warn("⚠️  Failed to cleanup old investments:", error);
  }
}

/**
 * Main execution function
 */
async function main() {
  const startTime = Date.now();

  try {
    await applyDailyReturns();
    await cleanupOldInvestments();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(
      `\n✅ Automatic investment processing completed in ${duration}s`
    );
  } catch (error) {
    console.error("❌ Processing failed:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGINT", () => {
  console.log("\n⏹️  Received shutdown signal, exiting gracefully...");
  process.exit(0);
});

process.on("SIGTERM", () => {
  console.log("\n⏹️  Received termination signal, exiting gracefully...");
  process.exit(0);
});

// Run the processor
main().catch((error) => {
  console.error("💥 Unhandled error:", error);
  process.exit(1);
});
