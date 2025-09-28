import cron from "node-cron";
import { runDailyInvestmentJob } from "../shared/dailyInvestmentJob.shared";
import { log } from "./logger";
import { supabase } from "./supabase";

console.log("🚀 Cron worker started");
// Schedule the daily returns job to run at a specific time (e.g., 2 AM UTC)
// The cron expression '0 2 * * *' means at minute 0 of hour 2 every day.

// Restored to daily 02:00 UTC schedule after early verification window.
cron.schedule(
  "0 2 * * *",
  async () => {
    console.log("⏰ Daily returns job executed at", new Date().toISOString());
    log.info("CRON: Trigger fired for daily investment return processing job.");
    try {
      // Idempotency: skip if a job_runs row already exists for today (UTC) with job_name = 'daily-investments'
      const todayUtc = new Date();
      const runDate = new Date(
        Date.UTC(
          todayUtc.getUTCFullYear(),
          todayUtc.getUTCMonth(),
          todayUtc.getUTCDate()
        )
      );
      const { data: existing, error: existingErr } = await supabase
        .from("job_runs")
        .select("id, started_at")
        .eq("job_name", "daily-investments")
        .gte("started_at", runDate.toISOString())
        .limit(1);
      if (!existingErr && existing && existing.length > 0) {
        log.info("CRON: Skipping daily job - already executed today", {
          runDate: runDate.toISOString(),
          existingId: existing[0].id,
        });
        return;
      }
      // Execute unified daily investment job logic
      const supabaseUrl = process.env.SUPABASE_URL;
      const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
      if (!supabaseUrl || !serviceRoleKey) {
        log.error(
          "CRON: Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars"
        );
        return;
      }
      const metrics = await runDailyInvestmentJob({
        supabaseUrl,
        serviceRoleKey,
        source: "cron",
        // Inject email sender so shared job can dispatch emails reliably in cron runtime
        sendEmail: buildCronEmailSender(),
        // adjust email flags if desired; keep defaults (completion emails on)
      });
      log.info(
        "CRON: Daily investment return processing job completed",
        metrics
      );
    } catch (error) {
      log.error("CRON: Error during daily investment return processing job.", {
        error,
      });
    }
  },
  {
    timezone: "UTC",
  }
);

log.info("CRON: Daily investment processing job has been scheduled.");

// Build a best-effort Nodemailer transport and return a sendEmail function for the shared job
function buildCronEmailSender() {
  try {
    // Load nodemailer lazily to avoid type dependency issues at compile time
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const nodemailer = require("nodemailer");
    const from =
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      "noreply@axixfinance.com";
    let transport: any = null;
    if (
      process.env.SMTP_HOST &&
      process.env.SMTP_USER &&
      process.env.SMTP_PASSWORD
    ) {
      transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD },
      });
    } else if (process.env.RESEND_API_KEY) {
      transport = nodemailer.createTransport({
        host: process.env.SMTP_HOST || "smtp.resend.com",
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: false,
        auth: { user: "resend", pass: process.env.RESEND_API_KEY },
      });
    }
    if (!transport) {
      return async () => false;
    }
    return async ({ to, subject, html, headers }: any) => {
      try {
        await transport.sendMail({
          from,
          to,
          subject,
          html,
          headers: headers || {},
        });
        return true;
      } catch (e: any) {
        log.warn("CRON: email send failed", { error: e?.message || String(e) });
        return false;
      }
    };
  } catch {
    return async () => false;
  }
}
