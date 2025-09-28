#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

// Setup env
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error(
    "[backfill] Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env; cannot proceed."
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
  global: { fetch: (...args) => fetch(...args) },
});

const INVESTMENT_PLANS = [
  {
    id: "starter",
    name: "STARTER PLAN",
    minAmount: 50,
    maxAmount: 999,
    dailyProfit: 2,
    duration: 3,
    totalReturn: 106,
  },
  {
    id: "premium",
    name: "PREMIUM PLAN",
    minAmount: 1000,
    maxAmount: 4999,
    dailyProfit: 3.5,
    duration: 7,
    totalReturn: 124.5,
  },
  {
    id: "delux",
    name: "DELUX PLAN",
    minAmount: 5000,
    maxAmount: 19999,
    dailyProfit: 5,
    duration: 10,
    totalReturn: 150,
  },
  {
    id: "luxury",
    name: "LUXURY PLAN",
    minAmount: 20000,
    maxAmount: null,
    dailyProfit: 7.5,
    duration: 30,
    totalReturn: 325,
  },
];

function parseDuration(raw, plan) {
  if (plan && typeof plan.duration === "number") return plan.duration;
  if (typeof raw === "number") return raw;
  if (typeof raw === "string") {
    const m = raw.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : 0;
  }
  return 0;
}

async function scheduleFirstProfit(investmentId) {
  const now = new Date();
  const tomorrowUtc = new Date(
    Date.UTC(
      now.getUTCFullYear(),
      now.getUTCMonth(),
      now.getUTCDate() + 1,
      0,
      0,
      0,
      0
    )
  );
  const { error } = await supabase
    .from("investments")
    .update({
      first_profit_date: tomorrowUtc.toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", investmentId);
  if (error) {
    console.warn("[backfill] scheduleFirstProfit failed", error);
    return false;
  }
  return true;
}

async function createInvestmentFromTransactionRecord(
  txId,
  planId,
  { skipActiveDepositsIncrement } = {}
) {
  // Load transaction
  const { data: transaction, error: txError } = await supabase
    .from("transactions")
    .select("*")
    .eq("id", txId)
    .single();
  if (txError || !transaction) return null;
  if (transaction.status !== "completed") return null;

  // Check existing
  const { data: existing, error: exErr } = await supabase
    .from("investments")
    .select("id")
    .eq("transaction_id", txId)
    .single();
  if (existing) return null;
  if (exErr && exErr.code && exErr.code !== "PGRST116") return null;

  // Plan resolution
  let plan = planId ? INVESTMENT_PLANS.find((p) => p.id === planId) : undefined;
  const txPlanName = transaction.plan_name || transaction.planName;
  if (!plan && txPlanName)
    plan = INVESTMENT_PLANS.find((p) => p.name === txPlanName);

  const amount = parseFloat(transaction.amount);
  if (plan) {
    if (amount < plan.minAmount || (plan.maxAmount && amount > plan.maxAmount))
      return null;
  }

  // Resolve numeric user id (transactions.user_id may be uid string or number depending on path)
  let numericUserId = null;
  if (typeof transaction.user_id === "number") {
    numericUserId = Number(transaction.user_id);
  } else if (typeof transaction.user_id === "string") {
    const { data: userRow, error: userErr } = await supabase
      .from("users")
      .select("id")
      .eq("uid", transaction.user_id)
      .single();
    if (userErr || !userRow) return null;
    numericUserId = Number(userRow.id);
  }
  if (!numericUserId) return null;

  const startDate = new Date(transaction.created_at);
  const numericDuration = parseDuration(
    transaction.plan_duration || transaction.planDuration,
    plan
  );
  const endDate = new Date(startDate);
  endDate.setDate(endDate.getDate() + numericDuration);

  const { data: inserted, error: invError } = await supabase
    .from("investments")
    .insert({
      user_id: numericUserId,
      transaction_id: transaction.id,
      plan_name: (plan && plan.name) || txPlanName || "UNKNOWN",
      plan_duration: numericDuration,
      daily_profit:
        (plan && plan.dailyProfit) ||
        Number(transaction.daily_profit || transaction.dailyProfit || 0),
      total_return:
        (plan && plan.totalReturn) ||
        Number(transaction.total_return || transaction.totalReturn || 0),
      principal_amount: amount,
      start_date: startDate.toISOString(),
      end_date: endDate.toISOString(),
      status: "active",
      days_elapsed: 0,
      total_earned: 0,
    })
    .select("*")
    .single();
  if (invError || !inserted) return null;

  if (!skipActiveDepositsIncrement) {
    try {
      await supabase.rpc("increment_user_active_deposits", {
        user_id_input: numericUserId,
        amount_input: amount,
      });
    } catch (e) {
      console.warn(
        "[backfill] increment_user_active_deposits RPC failed",
        e?.message || e
      );
    }
  }
  return inserted;
}

async function main() {
  const limit = Number(process.env.LIMIT || 50);
  const days = Number(process.env.DAYS || 7);
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

  console.log(`[backfill] scanning since ${since}, limit ${limit}`);

  // Find completed transactions with plan data and no investment row
  const { data: txs, error } = await supabase
    .from("transactions")
    .select(
      "id, user_id, amount, plan_name, plan_duration, daily_profit, total_return, description, created_at"
    )
    .eq("status", "completed")
    .not("plan_name", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("[backfill] query error", error);
    process.exit(1);
  }

  let attempted = 0;
  let created = 0;
  for (const tx of txs || []) {
    // Skip if investment exists
    const { data: existing, error: exErr } = await supabase
      .from("investments")
      .select("id")
      .eq("transaction_id", tx.id)
      .single();
    if (existing) continue;
    if (exErr && exErr.code && exErr.code !== "PGRST116") {
      console.warn("[backfill] check existing error", exErr);
      continue;
    }

    attempted++;
    const planId = (() => {
      const name = tx.plan_name || "";
      if (/starter/i.test(name)) return "starter";
      if (/premium/i.test(name)) return "premium";
      if (/delux/i.test(name)) return "delux";
      if (/luxury/i.test(name)) return "luxury";
      return undefined;
    })();

    // Detect reinvest transactions by description prefix
    const isReinvest =
      typeof tx.description === "string" &&
      /^(reinvest\s*-\s*)/i.test(tx.description);

    // In reinvest flow, active_deposits was already incremented when funds moved; so skip increment here
    const skipActiveDepositsIncrement = isReinvest ? true : false;

    // Optional DRY_RUN mode for safety
    const DRY_RUN =
      String(process.env.DRY_RUN || "").toLowerCase() === "1" ||
      String(process.env.DRY_RUN || "").toLowerCase() === "true";

    if (DRY_RUN) {
      console.log(
        `[backfill][dry-run] would create investment for tx ${tx.id} (plan=${tx.plan_name || planId || "?"}, reinvest=${isReinvest}, skipActiveDepositsIncrement=${skipActiveDepositsIncrement})`
      );
      continue;
    }

    const investment = await createInvestmentFromTransactionRecord(
      tx.id,
      planId,
      {
        skipActiveDepositsIncrement,
      }
    );
    if (investment) {
      created++;
      console.log(
        `[backfill] created investment ${investment.id} for tx ${tx.id}`
      );
      // Schedule first profit for consistency with approval/reinvest flows
      try {
        const ok = await scheduleFirstProfit(investment.id);
        if (!ok) {
          console.warn(
            `[backfill] failed to schedule first profit for investment ${investment.id}`
          );
        }
      } catch (e) {
        console.warn(
          `[backfill] scheduleFirstProfit error for investment ${investment.id}`,
          e
        );
      }
    } else {
      console.warn(`[backfill] failed to create investment for tx ${tx.id}`);
    }
  }

  console.log(`[backfill] attempted=${attempted} created=${created}`);
}

main().catch((e) => {
  console.error("[backfill] fatal", e);
  process.exit(1);
});
