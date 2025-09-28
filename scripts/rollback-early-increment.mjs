#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("[rollback] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const argv = process.argv.slice(2);
const getVal = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const invId = parseInt(
  getVal("--investment", process.env.INVESTMENT_ID || ""),
  10
);
const date = getVal("--date", process.env.RETURN_DATE || "");
const APPLY = argv.includes("--apply") || process.env.APPLY === "1";

if (!Number.isFinite(invId) || !date) {
  console.error(
    "Usage: node scripts/rollback-early-increment.mjs --investment <id> --date <YYYY-MM-DD> [--apply]"
  );
  process.exit(1);
}

function utcStartOfDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function dayRangeIso(yyyyMmDd) {
  const [y, m, d] = yyyyMmDd.split("-").map((v) => parseInt(v, 10));
  const start = new Date(Date.UTC(y, m - 1, d));
  const end = new Date(Date.UTC(y, m - 1, d + 1));
  return { start: start.toISOString(), end: end.toISOString() };
}

function fmt(n) {
  return Number(n).toFixed(2);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

async function main() {
  console.log(`[rollback] Inspecting investment ${invId} for date ${date}`);
  const { start, end } = dayRangeIso(date);

  const { data: inv, error: invErr } = await supabase
    .from("investments")
    .select(
      "id, user_id, principal_amount, daily_profit, total_earned, days_elapsed, last_return_applied"
    )
    .eq("id", invId)
    .single();
  if (invErr || !inv) {
    console.error("[rollback] Investment not found:", invErr);
    process.exit(2);
  }

  const { data: rets, error: retErr } = await supabase
    .from("investment_returns")
    .select("id, amount, return_date, created_at")
    .eq("investment_id", invId)
    .gte("return_date", start)
    .lt("return_date", end)
    .order("created_at", { ascending: true });
  if (retErr) {
    console.error("[rollback] Query returns error:", retErr);
    process.exit(3);
  }

  if (!rets || !rets.length) {
    console.log("[rollback] No returns found on that date.");
    return;
  }

  // Choose the earliest created row for that date to rollback (typical early increment)
  const target = rets[0];
  console.log(
    `[rollback] Candidate return id=${target.id} amount=$${fmt(target.amount)} return_date=${target.return_date}`
  );

  if (!APPLY) {
    console.log("[rollback] Dry-run. Use --apply to execute updates.");
    return;
  }

  // 1) Delete the investment_returns row
  const { error: delErr } = await supabase
    .from("investment_returns")
    .delete()
    .eq("id", target.id);
  if (delErr) {
    console.error("[rollback] Failed to delete return row:", delErr);
    process.exit(4);
  }

  // 2) Decrement investments.total_earned and days_elapsed; adjust last_return_applied back one day if it equals this day
  const newTotal = Number(inv.total_earned || 0) - Number(target.amount || 0);
  const newDays = Math.max(0, Number(inv.days_elapsed || 0) - 1);
  // Set last_return_applied to previous day’s UTC SOD if it matches the target day, else keep
  let nextLastApplied = inv.last_return_applied;
  try {
    const last = inv.last_return_applied
      ? new Date(inv.last_return_applied)
      : null;
    const ref = new Date(start);
    if (last && last.getTime() === new Date(start).getTime()) {
      const prev = new Date(ref.getTime() - 24 * 60 * 60 * 1000);
      nextLastApplied = utcStartOfDay(prev).toISOString();
    }
  } catch {}

  const { error: updErr } = await supabase
    .from("investments")
    .update({
      total_earned: newTotal,
      days_elapsed: newDays,
      last_return_applied: nextLastApplied,
      updated_at: new Date().toISOString(),
    })
    .eq("id", invId);
  if (updErr) {
    console.error("[rollback] Failed to update investment:", updErr);
    process.exit(5);
  }

  console.log(
    `[rollback] Success. Updated investment ${invId}: total_earned ${fmt(inv.total_earned)} -> ${fmt(newTotal)}, days_elapsed ${inv.days_elapsed} -> ${newDays}, last_return_applied -> ${nextLastApplied || "(unchanged)"}`
  );
}

main().catch((e) => {
  console.error("[rollback] Unhandled error:", e);
  process.exit(6);
});
