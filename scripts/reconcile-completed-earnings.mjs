#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import {
  dailyAmount,
  expectedTotalCompleted,
} from "../shared/investment-math.js";

function log(fields) {
  try {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        reconcile: "completed-earnings",
        ...fields,
      })
    );
  } catch {
    console.log(fields);
  }
}

function nearlyEqual(a, b, eps = 1e-6) {
  return Math.abs(Number(a) - Number(b)) <= eps;
}

async function main() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const dryRun = (process.env.DRY_RUN ?? "true").toLowerCase() !== "false";
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  const { data, error } = await supabase
    .from("completed_investments")
    .select("*")
    .limit(10000);
  if (error) {
    log({ event: "fetch_error", error: error.message });
    process.exit(1);
  }

  let fixes = 0;
  let scanned = 0;
  for (const inv of data || []) {
    scanned++;
    const principal = Number(inv.principal_amount || 0);
    const duration = Number(inv.duration || 0);
    const expected = expectedTotalCompleted(
      duration,
      principal,
      Number(inv.daily_profit || 0)
    );
    const reported = Number(inv.total_earned || 0);
    const dAmt = dailyAmount(principal, Number(inv.daily_profit || 0));
    if (!nearlyEqual(expected, reported)) {
      fixes++;
      log({
        event: "needs_fix",
        investment: inv.original_investment_id,
        user: inv.user_id,
        duration,
        dailyAmount: dAmt,
        expectedTotal: expected,
        reportedTotal: reported,
      });
      if (!dryRun) {
        const { error: upErr } = await supabase
          .from("completed_investments")
          .update({ total_earned: String(expected) })
          .eq("id", inv.id);
        if (upErr) {
          log({ event: "update_failed", id: inv.id, error: upErr.message });
        } else {
          log({ event: "updated", id: inv.id, total_earned: String(expected) });
        }
      }
    }
  }
  log({ event: "summary", scanned, fixes, dryRun });
}

main().catch((e) => {
  log({ event: "fatal", error: e.message });
  process.exit(1);
});
