#!/usr/bin/env node
// Check daily-investments job health directly via Supabase service role.
// Usage: node scripts/check-daily-job-health.mjs [--hours 26] [--json] [--strict]
// Exits non-zero if stale (when --strict provided) so it can be used in CI/cron alerting.
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

const SUPABASE_URL =
  process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE) {
  console.error(
    "[job-health] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
  process.exit(1);
}

const argv = process.argv.slice(2);
function flag(name) {
  return argv.includes(name);
}
function val(name, def) {
  const i = argv.indexOf(name);
  return i >= 0 && argv[i + 1] ? argv[i + 1] : def;
}

const STALE_HOURS = parseFloat(
  val("--hours", process.env.JOB_STALE_HOURS || "26")
);
const WANT_JSON = flag("--json");
const STRICT = flag("--strict");

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE, {
  auth: { persistSession: false },
});

function utcStart(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

async function main() {
  const { data: runs, error } = await supabase
    .from("job_runs")
    .select("*")
    .eq("job_name", "daily-investments")
    .order("started_at", { ascending: false })
    .limit(10);
  if (error) {
    console.error("[job-health] Query error:", error.message);
    process.exit(2);
  }
  const last = runs?.[0] || null;
  const nowMs = Date.now();
  const stale =
    !last ||
    nowMs - new Date(last.started_at).getTime() > STALE_HOURS * 3600 * 1000;
  const successes = (runs || []).filter((r) => r.success).length;
  const failures = (runs || []).filter((r) => !r.success).length;
  const avgProcessed =
    runs && runs.length
      ? Math.round(
          runs.reduce((a, r) => a + (r.processed_count || 0), 0) / runs.length
        )
      : 0;
  const avgCompleted =
    runs && runs.length
      ? Math.round(
          runs.reduce((a, r) => a + (r.completed_count || 0), 0) / runs.length
        )
      : 0;
  const payload = {
    ok: true,
    stale,
    staleThresholdHours: STALE_HOURS,
    now: new Date().toISOString(),
    lastRun: last,
    recentCount: runs?.length || 0,
    stats: {
      successes,
      failures,
      successRate:
        runs && runs.length ? +(successes / runs.length).toFixed(3) : 0,
      avgProcessed,
      avgCompleted,
    },
  };
  if (WANT_JSON) {
    console.log(JSON.stringify(payload, null, 2));
  } else {
    console.log(
      `[job-health] stale=${stale} (threshold ${STALE_HOURS}h) lastRun=${last ? last.started_at : "none"} successRate=${payload.stats.successRate}`
    );
    if (last) {
      console.log(
        `[job-health] last metrics processed=${last.processed_count} completed=${last.completed_count} totalApplied=${last.total_applied}`
      );
    }
  }
  if (STRICT && stale) process.exit(3);
}

main().catch((e) => {
  console.error("[job-health] Unhandled error:", e.message || e);
  process.exit(4);
});
