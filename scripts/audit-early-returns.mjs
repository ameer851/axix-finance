#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[audit-early] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const getVal = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DAYS = parseInt(getVal("--days", process.env.DAYS || "14"), 10);
const THRESH_MIN = parseInt(
  getVal("--threshold-min", process.env.THRESHOLD_MIN || "60"),
  10
); // minutes

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function toIsoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function diffMinutes(aIso, bIso) {
  const a = new Date(aIso).getTime();
  const b = new Date(bIso).getTime();
  return Math.round((a - b) / 60000);
}

async function main() {
  const sinceIso = toIsoDaysAgo(Number.isFinite(DAYS) ? DAYS : 14);
  console.log(
    `[audit-early] Scanning returns since ${sinceIso} (threshold ${THRESH_MIN} min)`
  );

  const { data: rows, error } = await supabase
    .from("investment_returns")
    .select("id, investment_id, user_id, amount, return_date, created_at")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false });
  if (error) {
    console.error("[audit-early] Query error:", error);
    process.exit(2);
  }

  const early = [];
  for (const r of rows || []) {
    // If created_at is earlier than return_date by >= THRESH_MIN minutes, it's early
    const minutesEarly = diffMinutes(r.return_date, r.created_at);
    if (minutesEarly >= THRESH_MIN) {
      early.push({ ...r, minutesEarly });
    }
  }

  console.log(`[audit-early] Found ${early.length} early return(s)`);
  early
    .slice(0, 50)
    .forEach((r) =>
      console.log(
        `   #${r.id} inv=${r.investment_id} user=${r.user_id} early=${r.minutesEarly}m amount=$${Number(r.amount).toFixed(2)} return_date=${new Date(
          r.return_date
        ).toISOString()} created_at=${new Date(r.created_at).toISOString()}`
      )
    );
}

main().catch((e) => {
  console.error("[audit-early] Unhandled error:", e);
  process.exit(3);
});
