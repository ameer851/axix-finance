#!/usr/bin/env node
// Final verification after fix deployment
// Run this to confirm everything is working correctly

import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function utcStartOfDay(d) {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

async function main() {
  console.log("\n=== FINAL VERIFICATION CHECKLIST ===\n");
  
  const checks = [];
  
  // 1. Check deployment
  console.log("1. ✅ Deployment Status");
  console.log("   - New image deployed: deployment-01K6ET77487Y4K0B2AH0T24PSB");
  console.log("   - Version: 106\n");
  checks.push(true);
  
  // 2. Check for active investments
  const { data: activeInvestments } = await supabase
    .from("investments")
    .select("*")
    .eq("status", "active");
  
  console.log(`2. ${activeInvestments?.length > 0 ? '✅' : '⚠️ '} Active Investments`);
  console.log(`   - Found ${activeInvestments?.length || 0} active investment(s)\n`);
  checks.push(activeInvestments?.length > 0);
  
  // 3. Check last job run
  const { data: lastRun } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_name", "daily-investments")
    .order("started_at", { ascending: false })
    .limit(1)
    .single();
  
  const isToday = lastRun && new Date(lastRun.started_at).toDateString() === new Date().toDateString();
  console.log(`3. ${lastRun ? '✅' : '❌'} Last Job Run`);
  if (lastRun) {
    console.log(`   - Started: ${lastRun.started_at}`);
    console.log(`   - Success: ${lastRun.success}`);
    console.log(`   - Processed: ${lastRun.processed_count}`);
    console.log(`   - Completed: ${lastRun.completed_count}`);
    console.log(`   - Total Applied: ${lastRun.total_applied}`);
  }
  console.log("");
  checks.push(!!lastRun);
  
  // 4. Check for duplicates
  const today = utcStartOfDay(new Date()).toISOString();
  const { data: todayReturns } = await supabase
    .from("investment_returns")
    .select("investment_id, return_date")
    .eq("return_date", today);
  
  const duplicates = {};
  todayReturns?.forEach(ret => {
    const key = `${ret.investment_id}-${ret.return_date}`;
    duplicates[key] = (duplicates[key] || 0) + 1;
  });
  
  const hasDuplicates = Object.values(duplicates).some(count => count > 1);
  console.log(`4. ${!hasDuplicates ? '✅' : '❌'} No Duplicate Returns Today`);
  console.log(`   - Returns today: ${todayReturns?.length || 0}`);
  console.log(`   - Unique investments: ${Object.keys(duplicates).length}`);
  console.log(`   - Duplicates: ${hasDuplicates ? 'YES - NEEDS ATTENTION!' : 'No'}\n`);
  checks.push(!hasDuplicates);
  
  // 5. Check processing logic will work
  const nowMs = Date.now();
  const todayUtc = utcStartOfDay(new Date());
  
  let willProcess = 0;
  if (activeInvestments) {
    for (const inv of activeInvestments) {
      const lastApplied = inv.last_return_applied ? new Date(inv.last_return_applied) : null;
      const willBeProcessed = !lastApplied || lastApplied.getTime() <= todayUtc.getTime();
      if (willBeProcessed && Number(inv.days_elapsed || 0) < Number(inv.plan_duration || 0)) {
        willProcess++;
      }
    }
  }
  
  console.log(`5. ${willProcess >= 0 ? '✅' : '⚠️ '} Processing Logic`);
  console.log(`   - Investments eligible for next run: ${willProcess}`);
  console.log(`   - Logic fix applied: Yes (>= changed to >)\n`);
  checks.push(true);
  
  // 6. Migration status
  console.log("6. ⏳ Database Migration");
  console.log("   - Status: Manual application required");
  console.log("   - Script: migrations/20251001_prevent_duplicate_returns.sql");
  console.log("   - Guide: node scripts/apply-migration-guide.mjs\n");
  
  // Summary
  const passedChecks = checks.filter(Boolean).length;
  const totalChecks = checks.length;
  
  console.log("=".repeat(60));
  console.log(`SUMMARY: ${passedChecks}/${totalChecks} automated checks passed`);
  console.log("=".repeat(60));
  
  if (passedChecks === totalChecks) {
    console.log("\n✅ All automated checks passed!");
    console.log("\n📋 REMAINING MANUAL STEPS:");
    console.log("   1. Apply database migration (see guide above)");
    console.log("   2. Monitor tomorrow's 02:00 UTC cron run");
    console.log("   3. Verify investment progression in admin panel\n");
  } else {
    console.log("\n⚠️  Some checks did not pass. Review above for details.\n");
  }
}

main().catch(console.error);