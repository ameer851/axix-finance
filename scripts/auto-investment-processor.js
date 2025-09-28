#!/usr/bin/env node

/**
 * Automatic Investment Returns Processor
 *
 * Applies daily returns to active investments and completes them when done.
 * Designed for cron. Safe to run once per day at UTC start.
 *
 * Usage:
 *   node scripts/auto-investment-processor.js [--dry-run]
 */

import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import {
  jobLog,
  runDailyInvestmentJob,
} from "../shared/dailyInvestmentJob.shared.js";

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Early diagnostic log (mask sensitive values)
console.log("[cron:init] Environment snapshot", {
  node: process.version,
  tz: process.env.TZ || "(default)",
  SUPABASE_URL_present: !!SUPABASE_URL,
  SERVICE_ROLE_key_len: SUPABASE_SERVICE_ROLE_KEY
    ? String(SUPABASE_SERVICE_ROLE_KEY).length
    : 0,
  RESEND_API_KEY_present: !!process.env.RESEND_API_KEY,
  SMTP_HOST: process.env.SMTP_HOST ? "(set)" : undefined,
  EMAIL_FROM: process.env.EMAIL_FROM || "(unset)",
  IMAGE_REF:
    process.env.FLY_IMAGE_REF || process.env.RENDER_GIT_COMMIT || undefined,
});

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "❌ Missing Supabase configuration (SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY). Aborting."
  );
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Optional mail transport (best-effort)
const mailFrom =
  process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@axixfinance.com";
let smtpTransport = null;
try {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  } else if (process.env.RESEND_API_KEY) {
    smtpTransport = nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    });
  }
} catch {}

async function sendMail(to, subject, html, headers) {
  if (!smtpTransport) {
    console.warn("[cron] sendMail skipped (no smtp transport configured)");
    return false;
  }
  try {
    await smtpTransport.sendMail({
      from: mailFrom,
      to,
      subject,
      html,
      headers: headers || {},
    });
    return true;
  } catch (e) {
    console.warn("[cron] email send failed", (e && e.message) || e);
    return false;
  }
}

const isDryRun = process.argv.includes("--dry-run");

function utcStartOfDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

// Wrapper maintains legacy console output while delegating core logic
async function applyDailyReturns() {
  jobLog({ event: "delegate_start", dryRun: isDryRun });
  const metrics = await runDailyInvestmentJob({
    supabaseUrl: SUPABASE_URL,
    serviceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    dryRun: isDryRun,
    source: "cron",
    sendEmail: async ({ to, subject, html, headers }) =>
      await sendMail(to, subject, html, headers),
    sendIncrementEmails: process.env.DAILY_JOB_INCREMENT_EMAILS === "true",
    sendCompletionEmails: process.env.DAILY_JOB_COMPLETION_EMAILS !== "false",
    forceCreditOnCompletionOnly:
      process.env.DAILY_JOB_FORCE_COMPLETION_ONLY === "true",
  });
  console.log("\n📈 Summary:");
  console.log(`   • Processed: ${metrics.processed}`);
  console.log(`   • Completed: ${metrics.completed}`);
  console.log(
    `   • Total returns applied: $${metrics.totalApplied.toFixed(2)}`
  );
}

async function main() {
  try {
    await applyDailyReturns();
    console.log("\n✅ Done");
  } catch (e) {
    console.error("❌ Failed:", e);
    process.exit(1);
  }
}

main();
