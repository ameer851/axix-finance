#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error(
    "[audit-dup] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
const getVal = (name, def) => {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
};
const DAYS = parseInt(getVal("--days", process.env.DAYS || "3"), 10);

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { persistSession: false },
});

function utcStartOfDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function toIsoDaysAgo(days) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d.toISOString();
}

function dateKey(iso) {
  const d = new Date(iso);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function isUtcSod(iso) {
  const d = new Date(iso);
  return (
    d.getUTCHours() === 0 &&
    d.getUTCMinutes() === 0 &&
    d.getUTCSeconds() === 0 &&
    d.getUTCMilliseconds() === 0
  );
}

async function main() {
  const sinceIso = toIsoDaysAgo(Number.isFinite(DAYS) ? DAYS : 3);
  console.log(`[audit-dup] Scanning returns since ${sinceIso}`);

  const { data: rows, error } = await supabase
    .from("investment_returns")
    .select("id, investment_id, user_id, amount, return_date, created_at")
    .gte("return_date", sinceIso)
    .order("return_date", { ascending: false });
  if (error) {
    console.error("[audit-dup] Query error:", error);
    process.exit(2);
  }

  const byInvDate = new Map();
  const nonSod = [];
  for (const r of rows || []) {
    const key = `${r.investment_id}|${dateKey(r.return_date)}`;
    if (!byInvDate.has(key)) byInvDate.set(key, []);
    byInvDate.get(key).push(r);
    if (!isUtcSod(r.return_date)) nonSod.push(r);
  }

  const dups = [];
  for (const [key, list] of byInvDate.entries()) {
    if (list.length > 1) {
      dups.push({ key, count: list.length, rows: list });
    }
  }

  console.log("[audit-dup] Summary:", {
    scanned: rows?.length || 0,
    duplicates: dups.length,
    nonUtcSod: nonSod.length,
  });

  if (dups.length) {
    console.log("\n[duplicates] same investment+date with multiple returns:");
    for (const d of dups) {
      console.log(`- ${d.key} x${d.count}`);
      d.rows.forEach((r) =>
        console.log(
          `   #${r.id} inv=${r.investment_id} user=${r.user_id} amount=$${Number(
            r.amount
          ).toFixed(
            2
          )} return_date=${new Date(r.return_date).toISOString()} created_at=${new Date(
            r.created_at
          ).toISOString()}`
        )
      );
    }
  }
  if (nonSod.length) {
    console.log("\n[non-UTC-SOD] returns with return_date not at 00:00:00Z:");
    nonSod.forEach((r) =>
      console.log(
        `   #${r.id} inv=${r.investment_id} user=${r.user_id} amount=$${Number(
          r.amount
        ).toFixed(
          2
        )} return_date=${new Date(r.return_date).toISOString()} created_at=${new Date(
          r.created_at
        ).toISOString()}`
      )
    );
  }
}

main().catch((e) => {
  console.error("[audit-dup] Unhandled error:", e);
  process.exit(3);
});
