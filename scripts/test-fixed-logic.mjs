#!/usr/bin/env node
// Test the fixed cron logic
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
  
  console.log(`\n=== TESTING FIXED LOGIC ===`);
  console.log(`Today UTC: ${todayIso}`);
  
  // Check investment with fixed logic
  const { data: activeInvestments, error } = await supabase
    .from("investments")
    .select("*")
    .eq("status", "active");
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`\nActive investments: ${activeInvestments?.length || 0}`);
  
  if (activeInvestments && activeInvestments.length > 0) {
    activeInvestments.forEach(inv => {
      const lastApplied = inv.last_return_applied ? new Date(inv.last_return_applied) : null;
      
      console.log(`\nInvestment ID: ${inv.id}`);
      console.log(`  Last return applied: ${inv.last_return_applied}`);
      console.log(`  Today UTC: ${todayIso}`);
      
      if (lastApplied) {
        console.log(`  lastApplied.getTime(): ${lastApplied.getTime()}`);
        console.log(`  todayUtc.getTime(): ${todayUtc.getTime()}`);
        console.log(`  lastApplied > todayUtc: ${lastApplied.getTime() > todayUtc.getTime()}`);
        console.log(`  Would be SKIPPED: ${lastApplied.getTime() > todayUtc.getTime()}`);
      } else {
        console.log(`  No last_return_applied - would be PROCESSED`);
      }
    });
  }
}

main().catch(console.error);