#!/usr/bin/env node
// Check for duplicate returns
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

async function main() {
  // Check for duplicates today
  const today = "2025-10-01T00:00:00+00:00";
  
  const { data: returns, error } = await supabase
    .from("investment_returns")
    .select("*")
    .eq("return_date", today)
    .order("created_at", { ascending: false });
    
  if (error) {
    console.error("Error:", error);
    return;
  }
  
  console.log(`Returns for ${today}:`);
  console.log(`Total: ${returns?.length || 0}`);
  
  if (returns && returns.length > 0) {
    const byInvestment = {};
    returns.forEach(ret => {
      const key = ret.investment_id;
      if (!byInvestment[key]) byInvestment[key] = [];
      byInvestment[key].push(ret);
    });
    
    Object.keys(byInvestment).forEach(investmentId => {
      const rets = byInvestment[investmentId];
      console.log(`\nInvestment ${investmentId}: ${rets.length} returns`);
      rets.forEach((ret, i) => {
        console.log(`  ${i+1}. ID: ${ret.id}, Amount: ${ret.amount}, Created: ${ret.created_at}`);
      });
      
      if (rets.length > 1) {
        console.log(`  ⚠️  DUPLICATE DETECTED for investment ${investmentId}`);
      }
    });
  }
}

main().catch(console.error);