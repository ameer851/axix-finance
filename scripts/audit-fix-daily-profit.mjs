#!/usr/bin/env node
import "dotenv/config";
// Audit and optionally fix daily_profit mismatches against plan rates
// Usage:
//   node scripts/audit-fix-daily-profit.mjs [--days 7] [--apply]
// Env vars: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[audit-fix-daily-profit] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars."
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
function getArgFlag(name) {
  return argv.includes(name);
}
function getArgValue(name, fallback) {
  const idx = argv.indexOf(name);
  if (idx >= 0 && idx + 1 < argv.length) return argv[idx + 1];
  return fallback;
}

const APPLY = getArgFlag("--apply") || process.env.APPLY === "1";
const DAYS = parseInt(getArgValue("--days", process.env.DAYS || "7"), 10);
const THRESHOLD = parseFloat(
  getArgValue("--threshold", process.env.THRESHOLD || "0.01")
);
const OUT_JSON = getArgValue("--out", process.env.OUT_JSON || "");

// Mirror server INVESTMENT_PLANS for consistency
const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "STARTER PLAN",
    minAmount: 50,
    maxAmount: 999,
    dailyProfit: 2,
    duration: 3,
    totalReturn: 106,
  },
  {
    id: "premium",
    name: "PREMIUM PLAN",
    minAmount: 1000,
    maxAmount: 4999,
    dailyProfit: 3.5,
    duration: 7,
    totalReturn: 124.5,
  },
  {
    id: "delux",
    name: "DELUX PLAN",
    minAmount: 5000,
    maxAmount: 19999,
    dailyProfit: 5,
    duration: 10,
    totalReturn: 150,
  },
  {
    id: "luxury",
    name: "LUXURY PLAN",
    minAmount: 20000,
    maxAmount: null,
    dailyProfit: 7.5,
    duration: 30,
    totalReturn: 325,
  },
];

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

function planByName(name) {
  if (!name) return null;
  return INVESTMENT_PLANS.find((p) => p.name === name) || null;
}

function toIsoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function fmt(n) {
  return Number(n).toFixed(2);
}

async function main() {
  const sinceIso = toIsoDaysAgo(Number.isFinite(DAYS) ? DAYS : 7);
  console.log(
    `[audit-fix-daily-profit] Scanning investments since ${sinceIso} (days=${DAYS}) APPLY=${APPLY ? "yes" : "no"} THRESHOLD=${THRESHOLD}`
  );

  const { data: rows, error } = await supabase
    .from("investments")
    .select(
      "id, plan_name, daily_profit, principal_amount, plan_duration, status, created_at"
    )
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[audit] Query error:", error);
    process.exit(2);
  }

  const mismatches = [];
  for (const inv of rows || []) {
    const plan = planByName(inv.plan_name);
    if (!plan) {
      console.warn(
        `[audit] Investment ${inv.id} unknown plan '${inv.plan_name}', skipping`
      );
      continue;
    }
    const expected = Number(plan.dailyProfit);
    const current = Number(inv.daily_profit);
    const delta = Math.abs(current - expected);
    if (delta > THRESHOLD) {
      mismatches.push({
        id: inv.id,
        planName: inv.plan_name,
        status: inv.status,
        createdAt: inv.created_at,
        principal: Number(inv.principal_amount || 0),
        current,
        expected,
        delta,
      });
    }
  }

  if (!mismatches.length) {
    console.log(
      "[audit] No daily_profit mismatches found in the selected window."
    );
    return;
  }

  console.log(`[audit] Found ${mismatches.length} mismatched investment(s):`);
  for (const m of mismatches) {
    console.log(
      `  - id=${m.id} plan='${m.planName}' createdAt=${m.createdAt} current=${fmt(m.current)} expected=${fmt(m.expected)} Δ=${fmt(m.delta)} principal=${fmt(m.principal)}`
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
        console.log(`[audit] Wrote JSON report to ${OUT_JSON}`);
      });
    } catch (e) {
      console.warn("[audit] Failed to write JSON report:", e?.message || e);
    }
  }

  if (!APPLY) {
    console.log(
      "[audit] Dry run mode (no updates applied). Use --apply to write fixes."
    );
    return;
  }

  let fixed = 0;
  for (const m of mismatches) {
    const { error: updErr } = await supabase
      .from("investments")
      .update({
        daily_profit: m.expected,
        updated_at: new Date().toISOString(),
      })
      .eq("id", m.id);
    if (updErr) {
      console.error(`[fix] Failed to update investment ${m.id}:`, updErr);
    } else {
      fixed += 1;
      console.log(
        `[fix] Updated investment ${m.id}: daily_profit ${fmt(m.current)} → ${fmt(m.expected)}`
      );
    }
  }

  console.log(`[audit] Completed. fixed=${fixed}/${mismatches.length}`);
}

main().catch((e) => {
  console.error("[audit] Unhandled error:", e);
  process.exit(3);
});
