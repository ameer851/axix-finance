#!/usr/bin/env node
import "dotenv/config";
// Audit investment_returns amounts against principal * daily_profit for recent returns
// Usage:
//   node scripts/audit-returns-amounts.mjs [--days 14] [--threshold 0.01] [--out report.json]
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[audit-returns] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
function getArgValue(name, fallback) {
  const i = argv.indexOf(name);
  if (i >= 0 && i + 1 < argv.length) return argv[i + 1];
  return fallback;
}

const DAYS = parseInt(getArgValue("--days", process.env.DAYS || "14"), 10);
const THRESHOLD = parseFloat(
  getArgValue("--threshold", process.env.THRESHOLD || "0.01")
);
const OUT_JSON = getArgValue("--out", process.env.OUT_JSON || "");

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function toIsoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function fmt(n) {
  return Number(n).toFixed(2);
}

async function main() {
  const sinceIso = toIsoDaysAgo(Number.isFinite(DAYS) ? DAYS : 14);
  console.log(
    `[audit-returns] Scanning returns since ${sinceIso} (days=${DAYS}) THRESHOLD=${THRESHOLD}`
  );

  // Join investment_returns with investments to get principal and current daily_profit
  // Note: This validates against the CURRENT investment.daily_profit, which is intentional post-fix
  const { data, error } = await supabase
    .from("investment_returns")
    .select(
      "id, investment_id, user_id, amount, return_date, created_at, investments:investment_id (id, principal_amount, daily_profit, plan_name)"
    )
    .gte("return_date", sinceIso)
    .order("return_date", { ascending: false });

  if (error) {
    console.error("[audit-returns] Query error:", error);
    process.exit(2);
  }

  const mismatches = [];
  for (const row of data || []) {
    const inv = row.investments;
    if (!inv) continue;
    const principal = Number(inv.principal_amount || 0);
    const expected = principal * (Number(inv.daily_profit || 0) / 100);
    const current = Number(row.amount || 0);
    const delta = Math.abs(current - expected);
    if (delta > THRESHOLD) {
      mismatches.push({
        returnId: row.id,
        investmentId: row.investment_id,
        planName: inv.plan_name,
        returnDate: row.return_date,
        current,
        expected,
        delta,
        principal,
        rate: Number(inv.daily_profit || 0),
      });
    }
  }

  if (!mismatches.length) {
    console.log(
      "[audit-returns] No return amount mismatches detected in the selected window."
    );
    return;
  }

  console.log(
    `[audit-returns] Found ${mismatches.length} mismatched return rows:`
  );
  for (const m of mismatches) {
    console.log(
      `  - returnId=${m.returnId} inv=${m.investmentId} plan='${m.planName}' date=${m.returnDate} current=${fmt(m.current)} expected=${fmt(m.expected)} Δ=${fmt(m.delta)} principal=${fmt(m.principal)} rate=${m.rate}%`
    );
  }

  if (OUT_JSON) {
    try {
      await import("node:fs").then(({ writeFileSync }) => {
        writeFileSync(
          OUT_JSON,
          JSON.stringify(
            { sinceIso, days: DAYS, threshold: THRESHOLD, mismatches },
            null,
            2
          )
        );
        console.log(`[audit-returns] Wrote JSON report to ${OUT_JSON}`);
      });
    } catch (e) {
      console.warn(
        "[audit-returns] Failed to write JSON report:",
        e?.message || e
      );
    }
  }
}

main().catch((e) => {
  console.error("[audit-returns] Unhandled error:", e);
  process.exit(3);
});
