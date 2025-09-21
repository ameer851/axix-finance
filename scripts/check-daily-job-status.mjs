#!/usr/bin/env node
// Health checker for daily-investments job
// Usage:
//   node scripts/check-daily-job-status.mjs --url https://app.example.com --token <ADMIN_BEARER>
// Exits 0 if healthy (not stale); 1 if stale or error.

import fetch from "node-fetch";

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === "--url") out.url = args[++i];
    else if (a === "--token") out.token = args[++i];
    else if (a === "--timeout") out.timeoutMs = parseInt(args[++i], 10);
  }
  return out;
}

async function main() {
  const { url, token, timeoutMs = 10000 } = parseArgs();
  if (!url) {
    console.error("Missing --url");
    process.exit(2);
  }
  const endpoint =
    url.replace(/\/$/, "") + "/api/admin/jobs/daily-investments/status";
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(endpoint, {
      headers: {
        Accept: "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      console.error("Request failed", res.status, await safeText(res));
      process.exit(1);
    }
    const data = await res.json();
    if (!data || !data.ok) {
      console.error("Unexpected response", data);
      process.exit(1);
    }
    const last = data.last;
    if (!last) {
      console.error("No last run found (stale)");
      process.exit(1);
    }
    const startedAt = new Date(last.started_at).getTime();
    const ageHours = (Date.now() - startedAt) / (1000 * 60 * 60);
    if (data.stale || ageHours > 26) {
      console.error(`STALE: last run ${ageHours.toFixed(2)}h ago`);
      process.exit(1);
    }
    if (last.success === false) {
      console.error("Last run recorded failure:", last.error_text);
      process.exit(1);
    }
    console.log(
      JSON.stringify({
        ok: true,
        ageHours: +ageHours.toFixed(2),
        processed: last.processed_count,
        completed: last.completed_count,
        totalApplied: last.total_applied,
      })
    );
    process.exit(0);
  } catch (e) {
    console.error("Error fetching job status:", e.message || e);
    process.exit(1);
  }
}

async function safeText(res) {
  try {
    return await res.text();
  } catch {
    return "(no body)";
  }
}

main();
