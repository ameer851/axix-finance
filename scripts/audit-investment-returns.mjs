#!/usr/bin/env node
import "dotenv/config";
import {
  dailyAmount,
  expectedTotalActive,
  expectedTotalCompleted,
} from "../shared/investment-math.js";
/**
 * Audit script: recompute expected investment earnings and detect discrepancies.
 *
 * Logic assumptions:
 *  - dailyAmount = principal_amount * (daily_profit / 100)
 *  - total expected earned for an active (not completed) investment = days_elapsed * dailyAmount
 *  - For completed investments migrated to completed_investments, we can recompute expected by duration * dailyAmount.
 *  - Policy cutoff: if start_date >= CREDIT_POLICY_CUTOFF_ISO then earnings were only credited to user balance on completion.
 *    Otherwise they were incrementally credited daily. This script only checks internal consistency (days_elapsed * dailyAmount == total_earned (for active)).
 *  - Rounding: We use toFixed(8) when comparing to allow small FP drift.
 *
 * Output:
 *  JSON lines with events: discrepancy_active, discrepancy_completed, summary.
 */
import { createClient } from "@supabase/supabase-js";

const CREDIT_POLICY_CUTOFF_ISO = "2025-09-18T00:00:00Z";

function jobLog(fields) {
  try {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        audit: "investment-returns",
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
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  let activeDiscrepancies = 0;
  let completedDiscrepancies = 0;

  // Active investments audit
  const { data: active, error: activeErr } = await supabase
    .from("investments")
    .select("*")
    .eq("status", "active");
  if (activeErr) {
    jobLog({ event: "fetch_active_error", error: activeErr.message });
  } else if (active) {
    for (const inv of active) {
      const principal = Number(inv.principal_amount || 0);
      const dailyAmt = dailyAmount(principal, Number(inv.daily_profit || 0));
      const expectedTotal = expectedTotalActive(
        Number(inv.days_elapsed || 0),
        principal,
        Number(inv.daily_profit || 0)
      );
      const reportedTotal = Number(inv.total_earned || 0);
      if (!nearlyEqual(expectedTotal, reportedTotal)) {
        activeDiscrepancies++;
        jobLog({
          event: "discrepancy_active",
          investment: inv.id,
          user: inv.user_id,
          days_elapsed: inv.days_elapsed,
          dailyAmount: dailyAmt,
          expectedTotal,
          reportedTotal,
        });
      }
    }
  }

  // Completed investments audit (snapshot table)
  const { data: completed, error: compErr } = await supabase
    .from("completed_investments")
    .select("*")
    .limit(5000); // safety
  if (compErr) {
    jobLog({ event: "fetch_completed_error", error: compErr.message });
  } else if (completed) {
    for (const inv of completed) {
      const principal = Number(inv.principal_amount || 0);
      const duration = Number(inv.duration || 0);
      const dailyAmt = dailyAmount(principal, Number(inv.daily_profit || 0));
      const expectedTotal = expectedTotalCompleted(
        duration,
        principal,
        Number(inv.daily_profit || 0)
      );
      const reportedTotal = Number(inv.total_earned || 0);
      if (!nearlyEqual(expectedTotal, reportedTotal)) {
        completedDiscrepancies++;
        jobLog({
          event: "discrepancy_completed",
          investment: inv.original_investment_id,
          user: inv.user_id,
          duration,
          dailyAmount: dailyAmt,
          expectedTotal,
          reportedTotal,
        });
      }
    }
  }

  jobLog({ event: "summary", activeDiscrepancies, completedDiscrepancies });
}

main().catch((e) => {
  jobLog({ event: "fatal", error: e.message });
  process.exit(1);
});
