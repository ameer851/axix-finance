#!/usr/bin/env node
// Diagnose why cron job runs but no changes are applied
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
  const now = new Date();
  const todayUtc = utcStartOfDay(now);
  const todayIso = todayUtc.toISOString();
  
  console.log(`\n=== CRON DIAGNOSTIC (${new Date().toISOString()}) ===`);
  console.log(`Today UTC: ${todayIso}`);
  
  // Check all active investments
  console.log("\n1. All active investments:");
  const { data: activeInvestments, error: activeError } = await supabase
    .from("investments")
    .select("*")
    .eq("status", "active");
    
  if (activeError) {
    console.error("Error fetching active investments:", activeError);
    return;
  }
  
  console.log(`Found ${activeInvestments?.length || 0} active investments`);
  
  if (activeInvestments && activeInvestments.length > 0) {
    activeInvestments.forEach(inv => {
      console.log(`  ID: ${inv.id}, User: ${inv.user_id}, Plan: ${inv.plan_name}`);
      console.log(`    Principal: ${inv.principal_amount}, Days elapsed: ${inv.days_elapsed}/${inv.plan_duration}`);
      console.log(`    Last return applied: ${inv.last_return_applied || 'NULL'}`);
      console.log(`    First profit date: ${inv.first_profit_date || 'NULL'}`);
      console.log(`    Start date: ${inv.start_date}`);
      
      // Check conditions
      const lastApplied = inv.last_return_applied ? new Date(inv.last_return_applied) : null;
      const firstProfitDate = inv.first_profit_date ? new Date(inv.first_profit_date) : null;
      
      console.log(`    Conditions:`);
      console.log(`      - Last applied < today UTC: ${!lastApplied || lastApplied.getTime() < todayUtc.getTime()}`);
      console.log(`      - First profit date <= today UTC: ${!firstProfitDate || firstProfitDate.getTime() <= todayUtc.getTime()}`);
      console.log(`      - Days elapsed < duration: ${Number(inv.days_elapsed || 0) < Number(inv.plan_duration || 0)}`);
      console.log("");
    });
  }
  
  // Check the exact query used by the cron job
  console.log("\n2. Investments matching cron job query:");
  const { data: cronInvestments, error: cronError } = await supabase
    .from("investments")
    .select("*")
    .eq("status", "active")
    .or(`last_return_applied.is.null,last_return_applied.lt.${todayIso},first_profit_date.lte.${todayIso}`);
    
  if (cronError) {
    console.error("Error with cron query:", cronError);
    return;
  }
  
  console.log(`Query result: ${cronInvestments?.length || 0} investments`);
  
  if (cronInvestments && cronInvestments.length > 0) {
    cronInvestments.forEach(inv => {
      console.log(`  ID: ${inv.id} - Would be processed`);
    });
  }
  
  // Check recent job runs
  console.log("\n3. Recent job runs:");
  const { data: jobRuns, error: jobError } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_name", "daily-investments")
    .order("started_at", { ascending: false })
    .limit(5);
    
  if (jobError) {
    console.error("Error fetching job runs:", jobError);
    return;
  }
  
  if (jobRuns && jobRuns.length > 0) {
    jobRuns.forEach(run => {
      console.log(`  ${run.started_at}: Success=${run.success}, Processed=${run.processed_count}, Completed=${run.completed_count}, Applied=${run.total_applied}`);
      if (run.error_text) console.log(`    Error: ${run.error_text}`);
    });
  }
  
  // Check recent investment returns
  console.log("\n4. Recent investment returns (last 3 days):");
  const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
  const { data: returns, error: returnsError } = await supabase
    .from("investment_returns")
    .select("*")
    .gte("return_date", threeDaysAgo)
    .order("created_at", { ascending: false })
    .limit(10);
    
  if (returnsError) {
    console.error("Error fetching returns:", returnsError);
    return;
  }
  
  console.log(`Found ${returns?.length || 0} recent returns`);
  if (returns && returns.length > 0) {
    returns.forEach(ret => {
      console.log(`  Investment ${ret.investment_id}: ${ret.amount} on ${ret.return_date} (created: ${ret.created_at})`);
    });
  }
}

main().catch(console.error);