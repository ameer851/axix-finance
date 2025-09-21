#!/usr/bin/env node
import pg from "pg";

// Basic expected schema map (extend as needed)
const expected = {
  users: ["id", "email", "balance", "active_deposits", "earned_money"],
  investments: [
    "id",
    "user_id",
    "transaction_id",
    "plan_name",
    "plan_duration",
    "daily_profit",
    "total_return",
    "principal_amount",
    "start_date",
    "end_date",
    "status",
    "days_elapsed",
    "total_earned",
  ],
  completed_investments: [
    "id",
    "original_investment_id",
    "user_id",
    "plan_name",
    "daily_profit",
    "duration",
    "principal_amount",
    "total_earned",
    "start_date",
    "end_date",
    "completed_at",
  ],
  job_runs: [
    "id",
    "job_name",
    "started_at",
    "finished_at",
    "success",
    "processed_count",
    "completed_count",
    "total_applied",
    "error_text",
    "source",
    "meta",
    "run_date",
  ],
  financial_ledger: [
    "id",
    "user_id",
    "entry_type",
    "reference_table",
    "reference_id",
    "amount_delta",
    "active_deposits_delta",
    "balance_after",
    "active_deposits_after",
    "metadata",
    "previous_hash",
    "entry_hash",
    "created_at",
  ],
};

const cn = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
if (!cn) {
  console.error("Missing SUPABASE_DB_URL/DATABASE_URL for schema diff");
  process.exit(1);
}

const client = new pg.Client({ connectionString: cn });
await client.connect();

async function fetchColumns(table) {
  const { rows } = await client.query(
    `SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name=$1`,
    [table]
  );
  return rows.map((r) => r.column_name).sort();
}

let diffs = 0;
for (const table of Object.keys(expected)) {
  const cols = await fetchColumns(table).catch(() => null);
  if (!cols) {
    console.log(JSON.stringify({ table, missing: true }));
    diffs++;
    continue;
  }
  const missing = expected[table].filter((c) => !cols.includes(c));
  const extra = cols.filter((c) => !expected[table].includes(c));
  if (missing.length || extra.length) {
    diffs++;
    console.log(JSON.stringify({ table, status: "diff", missing, extra }));
  } else {
    console.log(JSON.stringify({ table, status: "ok" }));
  }
}

await client.end();
if (diffs > 0) {
  process.exitCode = 2;
}
