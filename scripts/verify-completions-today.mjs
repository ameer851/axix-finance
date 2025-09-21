#!/usr/bin/env node

/**
 * Verify today's UTC completed investments summary.
 * - Counts today's completed_investments rows
 * - Sums today's principal + earnings
 * - Shows 5 latest completions
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
  console.log(`🔎 Verifying completions on/after ${todayUtc}`);

  const { data: rows, error } = await supabase
    .from("completed_investments")
    .select(
      "id, original_investment_id, user_id, principal_amount, total_earned, completed_at"
    )
    .gte("completed_at", todayUtc)
    .order("completed_at", { ascending: false });

  if (error) {
    console.error("❌ Query failed:", error);
    process.exit(1);
  }

  const count = rows?.length || 0;
  const sumPrincipal = (rows || []).reduce(
    (acc, r) => acc + Number(r.principal_amount || 0),
    0
  );
  const sumEarnings = (rows || []).reduce(
    (acc, r) => acc + Number(r.total_earned || 0),
    0
  );

  console.log(`\n✅ Today completions summary:`);
  console.log(`   • Count: ${count}`);
  console.log(`   • Principal unlocked: $${sumPrincipal.toFixed(2)}`);
  console.log(`   • Total earned:       $${sumEarnings.toFixed(2)}`);

  console.log(`\n🧾 Latest 5:`);
  for (const item of (rows || []).slice(0, 5)) {
    console.log(
      `   #${item.id} inv=${item.original_investment_id} user=${item.user_id} principal=$${Number(
        item.principal_amount
      ).toFixed(
        2
      )} earned=$${Number(item.total_earned).toFixed(2)} at ${new Date(
        item.completed_at
      ).toUTCString()}`
    );
  }

  process.exit(0);
}

main().catch((e) => {
  console.error("❌ Failed:", e);
  process.exit(1);
});
