#!/usr/bin/env node
/**
 * Production diagnostics: env, db, email, welcome email (optional), deposit confirmation (optional)
 * Usage:
 *  node scripts/diagnose-production.mjs --base https://www.axixfinance.com \
 *     --welcome test@example.com --token SUPABASE_JWT --deposit 25
 */
import fs from "fs";
import { argv } from "process";

const args = Object.fromEntries(
  argv.slice(2).map((a) => {
    const [k, v = "true"] = a.replace(/^--/, "").split("=");
    return [k, v];
  })
);

const base = (args.base || "https://www.axixfinance.com").replace(/\/$/, "");
const token = args.token;
const welcomeEmail = args.welcome || args.welcomeEmail;
const depositAmount = args.deposit ? Number(args.deposit) : null;
const timeoutMs = Number(args.timeout || 10000);

async function fetchJson(path, init = {}) {
  const controller = new AbortController();
  const to = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(base + path, {
      ...init,
      signal: controller.signal,
    });
    const text = await res.text();
    let json;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      json = { raw: text };
    }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, error: e.message };
  } finally {
    clearTimeout(to);
  }
}

function logSection(title) {
  console.log("\n=== " + title + " ===");
}

(async () => {
  const summary = { base };

  logSection("BOOT PHASE");
  const bootRes = await fetchJson("/api/boot-phase");
  summary.boot = bootRes;
  console.log(bootRes);

  logSection("ENV CHECK");
  const envRes = await fetchJson("/api/env-check");
  summary.env = envRes;
  console.log(envRes);

  logSection("DB HEALTH");
  const dbRes = await fetchJson("/api/db-health");
  summary.db = dbRes;
  console.log(dbRes);

  logSection("EMAIL HEALTH");
  const emailRes = await fetchJson("/api/email-health");
  summary.email = emailRes;
  console.log(emailRes);

  if (welcomeEmail) {
    logSection("WELCOME EMAIL TEST");
    const weRes = await fetchJson("/api/send-welcome-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: welcomeEmail,
        username: "diagUser",
        firstName: "Diag",
        lastName: "User",
      }),
    });
    summary.welcome = weRes;
    console.log(weRes);
  }

  if (token && depositAmount) {
    logSection("DEPOSIT CONFIRMATION TEST");
    const depRes = await fetchJson("/api/transactions/deposit-confirmation", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer " + token,
      },
      body: JSON.stringify({
        amount: depositAmount,
        method: "crypto",
        transactionHash: "diag-hash-" + Date.now(),
        planName: "DiagPlan",
      }),
    });
    summary.deposit = depRes;
    console.log(depRes);
  }

  // High-level evaluation
  const evaluation = [];
  if (!envRes.ok || !envRes.json?.supabaseConfigured)
    evaluation.push("Supabase not fully configured");
  if (dbRes.json && dbRes.json.configured && !dbRes.json.reachable)
    evaluation.push("DB configured but not reachable");
  if (!emailRes.json?.apiKeyPresent) evaluation.push("Resend API key missing");
  if (emailRes.json?.apiKeyPresent && !emailRes.json?.clientReady)
    evaluation.push("Resend client failed to init");
  if (welcomeEmail && !summary.welcome?.ok)
    evaluation.push("Welcome email send failed");
  if (depositAmount && !summary.deposit?.ok)
    evaluation.push("Deposit confirmation failed");
  if (!evaluation.length) evaluation.push("All core diagnostics passed");

  logSection("SUMMARY");
  console.log({ evaluation, summary });

  // Write optional JSON report
  if (args.report) {
    fs.writeFileSync(
      args.report,
      JSON.stringify({ evaluation, summary }, null, 2)
    );
    console.log("Report written to", args.report);
  }
})();
