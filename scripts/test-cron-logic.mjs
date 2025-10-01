#!/usr/bin/env node
// Test the cron job logic with fixed conditions
import { runDailyInvestmentJob } from "../shared/dailyInvestmentJob.shared.js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

async function main() {
  console.log("\n=== TESTING CRON JOB LOGIC ===");
  console.log("Running with dryRun=true to see what would happen...\n");
  
  try {
    const result = await runDailyInvestmentJob({
      supabaseUrl: SUPABASE_URL,
      serviceRoleKey: SERVICE_ROLE,
      dryRun: true,
      source: "manual-test",
      sendIncrementEmails: false,
      sendCompletionEmails: false,
    });
    
    console.log("\n=== RESULTS ===");
    console.log(`Processed: ${result.processed}`);
    console.log(`Completed: ${result.completed}`);
    console.log(`Total Applied: ${result.totalApplied}`);
  } catch (error) {
    console.error("Error:", error);
  }
}

main().catch(console.error);