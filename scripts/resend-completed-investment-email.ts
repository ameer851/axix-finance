#!/usr/bin/env -S node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";

// We import TS modules directly since this script will be run with `tsx`
import {
  initializeEmailServices,
  isEmailServiceConfigured,
} from "../server/emailManager";
import { sendInvestmentCompletedEmail } from "../server/emailService";
import { expectedTotalCompleted } from "../shared/investment-math.js";

type CLIOpts = {
  investmentId?: number;
  userId?: number;
  userUid?: string;
  since?: string; // ISO date
  limit?: number;
  dryRun?: boolean;
  principal?: number;
  plan?: string;
  recompute?: boolean;
  totalEarned?: number;
};

function parseArgs(argv: string[]): CLIOpts {
  const out: CLIOpts = {};
  for (const arg of argv.slice(2)) {
    const [k, v] = arg.split("=");
    const key = k.replace(/^--/, "");
    switch (key) {
      case "investmentId":
        out.investmentId = Number(v);
        break;
      case "userId":
        out.userId = Number(v);
        break;
      case "userUid":
        out.userUid = v;
        break;
      case "since":
        out.since = v;
        break;
      case "limit":
        out.limit = Number(v);
        break;
      case "dryRun":
        out.dryRun = v?.toLowerCase() !== "false";
        break;
      case "principal":
        out.principal = Number(v);
        break;
      case "plan":
        out.plan = v;
        break;
      case "recompute":
        out.recompute = v?.toLowerCase() !== "false";
        break;
      case "totalEarned":
        out.totalEarned = Number(v);
        break;
    }
  }
  if (typeof out.dryRun === "undefined") out.dryRun = true;
  if (!out.limit) out.limit = 10;
  return out;
}

function log(fields: Record<string, any>) {
  try {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        resend: "completed-email",
        ...fields,
      })
    );
  } catch {
    // eslint-disable-next-line no-console
    console.log(fields);
  }
}

async function main() {
  const opts = parseArgs(process.argv);
  const supabaseUrl = process.env.SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Ensure email system is configured/initialized
  const configured = isEmailServiceConfigured();
  if (!configured) {
    const ok = await initializeEmailServices();
    if (!ok)
      throw new Error(
        "Email service is not configured; set RESEND_API_KEY / EMAIL_FROM"
      );
  }

  // Build selection
  let rows: any[] = [];

  // Helper to apply optional filters
  const applyFilters = (q: any) => {
    if (typeof opts.principal === "number" && !Number.isNaN(opts.principal)) {
      // DB stores as text in some places; use String for equality
      q = q.eq("principal_amount", String(opts.principal));
    }
    if (opts.plan) q = q.ilike("plan_name", `%${opts.plan}%`);
    if (opts.since) q = q.gte("completed_at", opts.since);
    return q;
  };

  // Map userUid -> numeric userId if provided
  if (opts.userUid && !opts.userId) {
    const { data: userMap, error: mapErr } = await supabase
      .from("users")
      .select("id,uid")
      .eq("uid", opts.userUid)
      .single();
    if (mapErr || !userMap) {
      log({
        event: "user_uid_not_found",
        userUid: opts.userUid,
        error: mapErr?.message,
      });
    } else {
      opts.userId = Number(userMap.id);
    }
  }
  if (opts.investmentId) {
    const { data, error } = await supabase
      .from("completed_investments")
      .select("*")
      .eq("original_investment_id", opts.investmentId)
      .limit(1);
    if (error) throw new Error(error.message);
    rows = data || [];
  } else if (opts.userId) {
    let query = supabase
      .from("completed_investments")
      .select("*")
      .eq("user_id", opts.userId)
      .order("completed_at", { ascending: false })
      .limit(opts.limit!);
    query = applyFilters(query);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows = data || [];
  } else {
    // fallback: most recent N overall (use with care)
    let query = supabase
      .from("completed_investments")
      .select("*")
      .order("completed_at", { ascending: false })
      .limit(opts.limit!);
    query = applyFilters(query);
    const { data, error } = await query;
    if (error) throw new Error(error.message);
    rows = data || [];
  }

  if (!rows.length) {
    log({ event: "nothing_selected" });
    return;
  }

  for (const snap of rows) {
    // Fetch user basics
    const { data: user, error: uErr } = await supabase
      .from("users")
      .select("id,email,username")
      .eq("id", snap.user_id)
      .single();
    if (uErr || !user) {
      log({
        event: "user_fetch_error",
        investment: snap.original_investment_id,
        error: uErr?.message,
      });
      continue;
    }

    const principal = Number(snap.principal_amount || 0);
    const duration = Number(snap.duration || 0);
    const dailyProfit = Number(snap.daily_profit || 0);
    const computed = expectedTotalCompleted(duration, principal, dailyProfit);
    const finalTotal =
      typeof opts.totalEarned === "number" && !Number.isNaN(opts.totalEarned)
        ? opts.totalEarned
        : opts.recompute
          ? computed
          : Number(snap.total_earned || 0);

    const payload = {
      planName: snap.plan_name || "Investment Plan",
      duration,
      totalEarned: finalTotal,
      principal,
      endDateUtc:
        snap.completed_at || snap.end_date || new Date().toISOString(),
    } as const;

    log({
      event: "prepared",
      investment: snap.original_investment_id,
      user: user.id,
      dryRun: opts.dryRun,
      payload,
    });
    if (opts.dryRun) continue;

    try {
      await sendInvestmentCompletedEmail(user, payload);
      log({
        event: "resend_success",
        investment: snap.original_investment_id,
        user: user.id,
      });
    } catch (e: any) {
      log({
        event: "resend_failed",
        investment: snap.original_investment_id,
        user: user.id,
        error: e?.message,
      });
    }
  }
}

main().catch((e) => {
  log({ event: "fatal", error: e.message });
  process.exit(1);
});
