#!/usr/bin/env node

// Dynamic import of compiled server (or TS source) not strictly needed; we only call endpoint.
// Usage: node scripts/verify-ledger.mjs [--from 100] [--to 500] [--sample 200] [--host http://localhost:8080/api]

const args = process.argv.slice(2);
function arg(flag) {
  const i = args.indexOf(flag);
  if (i === -1) return undefined;
  return args[i + 1];
}
const host =
  arg("--host") || process.env.AXIX_API_URL || "http://localhost:8080/api";
const fromId = arg("--from");
const toId = arg("--to");
const sample = arg("--sample");

const q = new URLSearchParams();
if (fromId) q.set("fromId", fromId);
if (toId) q.set("toId", toId);
if (sample) q.set("sample", sample);

const urlFull = `${host.replace(/\/$/, "")}/admin/ledger/verify${q.size ? `?${q.toString()}` : ""}`;

(async () => {
  try {
    const res = await fetch(urlFull, {
      headers: {
        Authorization: process.env.AXIX_ADMIN_BEARER
          ? `Bearer ${process.env.AXIX_ADMIN_BEARER}`
          : "",
      },
    });
    const json = await res.json();
    if (!res.ok) {
      console.error("[ledger:verify] HTTP", res.status, json);
      process.exitCode = 1;
      return;
    }
    console.log(JSON.stringify(json, null, 2));
    if (json && json.ok === false) process.exitCode = 2;
  } catch (e) {
    console.error("[ledger:verify] exception", (e && e.message) || e);
    process.exitCode = 1;
  }
})();
