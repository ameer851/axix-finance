#!/usr/bin/env node

/**
 * Verify today's UTC investment returns summary.
 * - Counts today's investment_returns rows
 * - Sums today's amounts
 * - Shows 5 latest entries
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase configuration (.env)");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function utcStartOfDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

async function main() {
  const now = new Date();
  const todayUtc = utcStartOfDay(now).toISOString();
  console.log(`🔎 Verifying returns on/after ${todayUtc}`);

  const { data: rows, error } = await supabase
    .from("investment_returns")
    .select("id, investment_id, user_id, amount, return_date, created_at")
    .gte("return_date", todayUtc)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Query failed:", error);
    process.exit(1);
  }

  const count = rows?.length || 0;
  const sum = (rows || []).reduce((acc, r) => acc + Number(r.amount || 0), 0);

  console.log(`\n📈 Today summary:`);
  console.log(`   • Rows: ${count}`);
  console.log(`   • Sum:  $${sum.toFixed(2)}`);

  console.log(`\n🧾 Latest 5:`);
  for (const item of (rows || []).slice(0, 5)) {
    console.log(
      `   #${item.id} inv=${item.investment_id} user=${item.user_id} amount=$${Number(item.amount).toFixed(2)} at ${new Date(item.return_date).toUTCString()}`
    );
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
