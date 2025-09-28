#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

/*
 Quick per-day cron health summary.
 Usage:
   node scripts/cron-health-today.mjs [--job daily-investments] [--json]

 Reports:
  - Whether today's run exists
  - Start/finish timestamps, duration, source, success
  - Processed / completed counts & total_applied
  - If multiple rows (should not happen) lists duplicates
  - Hours since last success
  - If pending expected accruals still appear (using investment_returns vs active investments heuristic) when run claims success
*/

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error("[cron-health-today] Missing SUPABASE_URL or service role key");
  process.exit(1);
}

const argv = process.argv.slice(2);
function getVal(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
}
function has(name) {
  return argv.includes(name);
}

const JOB = getVal("--job", "daily-investments");
const WANT_JSON = has("--json");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function utcDateString(d = new Date()) {
  return d.toISOString().slice(0, 10); // YYYY-MM-DD
}

async function fetchTodayRuns(jobName) {
  const today = utcDateString();
  const { data, error } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_name", jobName)
    .eq("run_date", today)
    .order("started_at", { ascending: true });
  if (error) throw new Error("job_runs query failed: " + error.message);
  return data || [];
}

async function fetchLastSuccess(jobName) {
  const { data, error } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_name", jobName)
    .eq("success", true)
    .order("started_at", { ascending: false })
    .limit(1);
  if (error) throw new Error("last success query failed: " + error.message);
  return data?.[0] || null;
}

async function main() {
  const todayRuns = await fetchTodayRuns(JOB);
  const lastSuccess = await fetchLastSuccess(JOB);
  const now = new Date();
  const primary = todayRuns[0] || null;
  const duplicates = todayRuns.length > 1 ? todayRuns.slice(1) : [];
  let durationMs = null;
  if (primary && primary.started_at && primary.finished_at) {
    const startMs = new Date(primary.started_at).getTime();
    const endMs = new Date(primary.finished_at).getTime();
    durationMs = endMs - startMs;
    if (durationMs < 0) {
      // Data anomaly: flip & record absolute so monitoring doesn't show negative
      durationMs = Math.abs(durationMs);
    }
  }
  const hoursSinceLastSuccess = lastSuccess
    ? (now - new Date(lastSuccess.started_at)) / 36e5
    : null;

  // Basic sanity heuristic: if success today & processed_count = 0 but there are active investments expecting returns
  let expectedButZero = null;
  if (primary && primary.success && primary.processed_count === 0) {
    try {
      // Count active investments that are past first_profit_date and not completed today (lightweight)
      const today = utcDateString();
      const { data: active, error: actErr } = await supabase
        .from("investments")
        .select("id, first_profit_date, completed_at")
        .is("completed_at", null);
      if (!actErr && active) {
        const eligible = active.filter(
          (inv) =>
            !inv.completed_at &&
            inv.first_profit_date &&
            inv.first_profit_date <= today
        );
        expectedButZero = eligible.length > 0 ? eligible.length : null;
      }
    } catch {
      /* swallow diagnostic errors */
    }
  }

  const report = {
    job: JOB,
    today: utcDateString(),
    hasRun: !!primary,
    success: primary?.success ?? false,
    source: primary?.source || null,
    started_at: primary?.started_at || null,
    finished_at: primary?.finished_at || null,
    duration_ms: durationMs,
    processed_count: primary?.processed_count ?? null,
    completed_count: primary?.completed_count ?? null,
    total_applied: primary?.total_applied ?? null,
    error_text: primary?.error_text || null,
    duplicates: duplicates.map((d) => ({
      id: d.id,
      started_at: d.started_at,
      source: d.source,
    })),
    duplicates_count: duplicates.length,
    hours_since_last_success: hoursSinceLastSuccess,
    anomaly_expected_active_investments: expectedButZero,
    stale: hoursSinceLastSuccess != null && hoursSinceLastSuccess > 26,
  };

  if (WANT_JSON) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      `[cron-health-today] job=${JOB} run=${report.hasRun ? "present" : "MISSING"} success=${report.success} source=${report.source || "-"} processed=${report.processed_count} completed=${report.completed_count} applied=${report.total_applied}`
    );
    if (report.duration_ms != null)
      console.log(
        `[cron-health-today] duration=${report.duration_ms}ms started_at=${report.started_at} finished_at=${report.finished_at}`
      );
    if (report.duplicates_count)
      console.log(
        `[cron-health-today] duplicates=${report.duplicates_count} -> ${report.duplicates.map((d) => d.source).join(",")}`
      );
    if (report.anomaly_expected_active_investments)
      console.log(
        `[cron-health-today] anomaly: success but zero processed; ${report.anomaly_expected_active_investments} active investments appear eligible.`
      );
    if (report.stale)
      console.log(
        `[cron-health-today] WARNING: last success ${report.hours_since_last_success?.toFixed(2)}h ago (>26h)`
      );
  }
}

main().catch((e) => {
  console.error("[cron-health-today] Unhandled error:", e.message || e);
  process.exit(2);
});
