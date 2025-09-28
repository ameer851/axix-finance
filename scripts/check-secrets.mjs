#!/usr/bin/env node
import "dotenv/config";

// Simple secrets diagnostics. Shows whether required env vars are set.
// Usage: node scripts/check-secrets.mjs [--json] [--mask]
//   --json : output machine-readable JSON
//   --mask : mask values (default masks unless --no-mask provided)

const argv = process.argv.slice(2);
const wantsJson = argv.includes("--json");
const wantsMask = argv.includes("--mask") || !argv.includes("--no-mask");

const REQUIRED = [
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
  "SUPABASE_ANON_KEY",
  "SUPABASE_JWT_SECRET",
  "DATABASE_URL", // or SUPABASE_DB_URL
  "SUPABASE_DB_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "SESSION_SECRET",
];

function mask(val) {
  if (!val) return val;
  if (!wantsMask) return val;
  if (val.length <= 8) return "*".repeat(val.length);
  return val.slice(0, 4) + "***" + val.slice(-4);
}

const report = REQUIRED.map((name) => {
  const raw = process.env[name];
  return {
    name,
    present: !!raw,
    value: raw ? mask(raw) : null,
  };
});

// Derived warnings
const warnings = [];
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  warnings.push(
    "Missing SUPABASE_SERVICE_ROLE_KEY (cron + server-side admin ops will fail)."
  );
}
if (!process.env.SUPABASE_URL) {
  warnings.push("Missing SUPABASE_URL (cannot reach Supabase).");
}
if (
  process.env.SUPABASE_SERVICE_ROLE_KEY &&
  process.env.SUPABASE_SERVICE_ROLE_KEY === process.env.SUPABASE_ANON_KEY
) {
  warnings.push(
    "SERVICE_ROLE_KEY appears identical to ANON key — verify you used the service role secret."
  );
}
if (!process.env.SESSION_SECRET) {
  warnings.push(
    "SESSION_SECRET not set; sessions / signed cookies may be insecure."
  );
}
if (!process.env.SUPABASE_JWT_SECRET) {
  warnings.push(
    "SUPABASE_JWT_SECRET missing; bearer verification will fall back or fail."
  );
}

if (wantsJson) {
  console.log(JSON.stringify({ report, warnings }, null, 2));
  process.exit(0);
}

console.log("Secrets diagnostics:\n");
for (const r of report) {
  console.log(
    `${r.name.padEnd(28)} : ${r.present ? "SET" : "MISSING"}${r.present ? "  " + r.value : ""}`
  );
}
if (warnings.length) {
  console.log("\nWarnings:");
  warnings.forEach((w) => console.log(" - " + w));
} else {
  console.log("\nNo critical warnings.");
}
