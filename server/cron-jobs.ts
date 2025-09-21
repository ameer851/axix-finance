import cron from "node-cron";
import { runDailyInvestmentJob } from "../shared/dailyInvestmentJob.shared";
import { log } from "./logger";
import { supabase } from "./supabase";

// Schedule the daily returns job to run at a specific time (e.g., 2 AM UTC)
// The cron expression '0 2 * * *' means at minute 0 of hour 2 every day.
cron.schedule(
  "0 2 * * *",
  async () => {
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
