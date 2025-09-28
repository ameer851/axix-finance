#!/usr/bin/env node
/**
 * Resend completion emails for investments completed today (UTC SOD to now).
 * Useful if a prior run did not send emails due to missing SMTP configuration.
 */
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import nodemailer from "nodemailer";
import {
  generateInvestmentCompletedEmailHTML,
  investmentCompletedSubject,
} from "../shared/emailTemplates.shared.js";

dotenv.config();

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

function utcStartOfDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

function getTransport() {
  if (
    process.env.SMTP_HOST &&
    process.env.SMTP_USER &&
    process.env.SMTP_PASSWORD
  ) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
    });
  }
  if (process.env.RESEND_API_KEY) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST || "smtp.resend.com",
      port: parseInt(process.env.SMTP_PORT || "587"),
      secure: false,
      auth: { user: "resend", pass: process.env.RESEND_API_KEY },
    });
  }
  return null;
}

const mailFrom =
  process.env.EMAIL_FROM || process.env.SMTP_USER || "noreply@axixfinance.com";

async function main() {
  const tx = new Date();
  const sod = utcStartOfDay(tx).toISOString();
  const { data: completed, error } = await supabase
    .from("completed_investments")
    .select(
      "original_investment_id,user_id,plan_name,duration,principal_amount,total_earned,completed_at"
    )
    .gte("completed_at", sod);
  if (error) {
    console.error("Query error:", error.message);
    process.exit(1);
  }
  if (!completed || completed.length === 0) {
    console.log("No completed investments today; nothing to resend.");
    return;
  }
  console.log(`Found ${completed.length} completed entries today`);

  const transport = getTransport();
  if (!transport) {
    console.error(
      "No SMTP/Resend transport configured; set RESEND_API_KEY or SMTP_* envs."
    );
    process.exit(1);
  }

  for (const row of completed) {
    const { data: user } = await supabase
      .from("users")
      .select("id,email,username")
      .eq("id", row.user_id)
      .single();
    if (!user?.email) continue;
    const subject = investmentCompletedSubject(
      row.plan_name || "Investment Plan"
    );
    const html = generateInvestmentCompletedEmailHTML(user, {
      planName: row.plan_name || "Investment Plan",
      duration: Number(row.duration || 0),
      totalEarned: Number(row.total_earned || 0),
      principal: Number(row.principal_amount || 0),
      endDateUtc: row.completed_at,
    });
    try {
      const info = await transport.sendMail({
        from: mailFrom,
        to: user.email,
        subject,
        html,
        headers: {
          "X-Axix-Mail-Event": "investment-completed",
          "X-Resend-Reason": "manual-resend",
        },
      });
      console.log("Resent completion email", {
        to: user.email,
        msg: info?.messageId,
        inv: row.original_investment_id,
      });
    } catch (e) {
      console.warn("Failed to resend to", user.email, e?.message || e);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
