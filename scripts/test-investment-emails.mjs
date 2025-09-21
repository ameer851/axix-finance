#!/usr/bin/env node

/**
 * Automated E2E email test for investment increment/completion
 *
 * Flow:
 * 1) Resolve/create a test investment for a provided user so first_profit_date <= today UTC
 * 2) Run the daily processor (LIVE by default)
 * 3) Poll audit_logs for Resend webhook entries matching the user's email and subjects
 * 4) Print a compact summary and exit non-zero if assertions fail
 *
 * Requirements:
 * - SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (service role)
 * - RESEND webhook configured to POST to /api/email/webhooks/resend on your server
 * - EMAIL_FROM + RESEND_API_KEY or SMTP_* for actual email dispatch
 *
 * Usage (PowerShell):
 *   node scripts/test-investment-emails.mjs --user-email you@example.com --plan "STARTER PLAN" --duration 1 --daily 2 --amount 100
 */

import { createClient } from "@supabase/supabase-js";
import { spawn } from "child_process";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, "../.env") });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!supabaseUrl || !supabaseServiceKey) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env");
  process.exit(1);
}
const supabase = createClient(supabaseUrl, supabaseServiceKey);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const key = argv[i];
    const next = argv[i + 1];
    if (key.startsWith("--")) {
      const name = key.slice(2);
      if (next && !next.startsWith("--")) {
        args[name] = next;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

function utcStartOfDay(date = new Date()) {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0
    )
  );
}

async function getUserByEmail(email) {
  const { data, error } = await supabase
    .from("users")
    .select("id, uid, email")
    .eq("email", email)
    .maybeSingle();
  if (error) throw error;
  return data;
}

async function ensureTestInvestment(user, opts) {
  const now = new Date();
  const startDate = now.toISOString();
  const endDate = new Date(
    now.getTime() + Number(opts.duration) * 86400000
  ).toISOString();
  const fpd = utcStartOfDay(now).toISOString();

  // Find existing active investment for the same plan created today
  const { data: existing, error: exErr } = await supabase
    .from("investments")
    .select("id")
    .eq("user_id", user.id)
    .eq("plan_name", opts.plan)
    .eq("status", "active")
    .gte("created_at", utcStartOfDay(now).toISOString())
    .limit(1)
    .maybeSingle();
  if (exErr) throw exErr;
  if (existing) return existing.id;

  // Insert a minimal transaction (using auth uid)
  const txPayload = {
    user_id: user.uid || user.id,
    type: "investment",
    amount: String(opts.amount),
    description: `E2E email test for ${opts.plan}`,
    status: "completed",
    plan_name: opts.plan,
    plan_duration: String(opts.duration),
    daily_profit: Number(opts.daily),
    total_return: Number(
      opts.total || Number(opts.amount) + Number(opts.daily)
    ),
  };
  const { data: tx, error: txErr } = await supabase
    .from("transactions")
    .insert(txPayload)
    .select("id")
    .single();
  if (txErr) throw txErr;

  const invPayload = {
    user_id: user.id,
    transaction_id: tx.id,
    plan_name: opts.plan,
    plan_duration: String(opts.duration),
    daily_profit: Number(opts.daily),
    total_return: Number(
      opts.total || Number(opts.amount) + Number(opts.daily)
    ),
    principal_amount: Number(opts.amount),
    start_date: startDate,
    end_date: endDate,
    status: "active",
    days_elapsed: 0,
    total_earned: 0,
    first_profit_date: fpd,
    created_at: startDate,
    updated_at: startDate,
  };
  const { data: inv, error: invErr } = await supabase
    .from("investments")
    .insert(invPayload)
    .select("id")
    .single();
  if (invErr) throw invErr;
  return inv.id;
}

function runProcessorLive() {
  return new Promise((resolve, reject) => {
    const proc = spawn(
      process.execPath,
      [join(__dirname, "auto-investment-processor.js")],
      {
        stdio: ["ignore", "pipe", "pipe"],
        cwd: join(__dirname),
        env: process.env,
      }
    );
    let stdout = "";
    let stderr = "";
    proc.stdout.on("data", (d) => (stdout += String(d)));
    proc.stderr.on("data", (d) => (stderr += String(d)));
    proc.on("close", (code) => {
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(new Error(`processor exited ${code}: ${stderr}`));
    });
  });
}

async function pollWebhookLogs(
  email,
  subjects,
  { timeoutMs = 60000, intervalMs = 3000 } = {}
) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeoutMs) {
    const { data, error } = await supabase
      .from("audit_logs")
      .select("id, description, details, created_at")
      .eq("action", "resend_webhook")
      .order("created_at", { ascending: false })
      .limit(200);
    if (!error && Array.isArray(data)) {
      const haystack = data.map((r) => ({
        subject: (() => {
          try {
            const d =
              typeof r.details === "string" ? JSON.parse(r.details) : r.details;
            return d?.subject || d?.data?.subject || r.description || "";
          } catch {
            return r.description || "";
          }
        })(),
        to: (() => {
          try {
            const d =
              typeof r.details === "string" ? JSON.parse(r.details) : r.details;
            return d?.to || d?.data?.to || null;
          } catch {
            return null;
          }
        })(),
      }));
      const matchedAll = subjects.every((subj) =>
        haystack.some((h) => String(h.subject || "").includes(subj))
      );
      const matchedAnyTo = haystack.some((h) =>
        String(h.to || "").includes(email)
      );
      if (matchedAll && matchedAnyTo) return true;
    }
    await new Promise((r) => setTimeout(r, intervalMs));
  }
  return false;
}

async function main() {
  const args = parseArgs(process.argv);
  const userEmail = args["user-email"] || args.email;
  if (!userEmail) {
    console.error("--user-email is required");
    process.exit(1);
  }
  const plan = args.plan || "STARTER PLAN";
  const duration = Number(args.duration || 1);
  const daily = Number(args.daily || 2);
  const amount = Number(args.amount || 100);
  const total = args.total ? Number(args.total) : undefined;

  const user = await getUserByEmail(userEmail);
  if (!user) {
    console.error(`User not found: ${userEmail}`);
    process.exit(1);
  }

  // Seed or reuse test investment
  const invId = await ensureTestInvestment(user, {
    plan,
    duration,
    daily,
    amount,
    total,
  });
  console.log("Using investment id:", invId);

  // Execute processor
  console.log("Running returns processor (LIVE)...");
  await runProcessorLive();

  // Subjects we expect to see via webhook logs (at least daily increment)
  const incrementSubject = `${process.env.WEBSITE_NAME || "AxixFinance"} - Daily Increment Applied (${plan})`;
  const completionSubject = `${process.env.WEBSITE_NAME || "AxixFinance"} - Plan Completed (${plan})`;
  const requiredSubjects =
    duration > 1 ? [incrementSubject] : [incrementSubject, completionSubject];

  console.log("Waiting for webhook events...");
  const ok = await pollWebhookLogs(userEmail, requiredSubjects, {
    timeoutMs: 90000,
    intervalMs: 3000,
  });
  if (!ok) {
    console.error(
      "Timed out waiting for webhook entries matching:",
      requiredSubjects
    );
    process.exit(2);
  }

  console.log("✅ Email E2E test passed: webhook events found for", userEmail);
}

main().catch((e) => {
  console.error("E2E test failed:", e);
  process.exit(1);
});
