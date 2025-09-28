#!/usr/bin/env node
import { createClient } from "@supabase/supabase-js";
import "dotenv/config";
import {
  dailyAmount,
  expectedTotalActive,
  expectedTotalCompleted,
} from "../shared/investment-math.js";

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i];
    const v = argv[i + 1];
    if (k?.startsWith("--")) {
      const name = k.slice(2);
      if (v && !v.startsWith("--")) {
        args[name] = v;
        i++;
      } else {
        args[name] = true;
      }
    }
  }
  return args;
}

function jlog(fields) {
  try {
    console.log(
      JSON.stringify({
        ts: new Date().toISOString(),
        script: "diagnose-user",
        ...fields,
      })
    );
  } catch {
    console.log(fields);
  }
}

async function main() {
  const args = parseArgs(process.argv);
  const uid = args.uid || args.user || args.userId || args.user_id;
  const idArg = args.id ? Number(args.id) : undefined;
  if (!uid && !idArg) {
    console.error(
      "Usage: node scripts/diagnose-user.mjs --uid <auth-uid> | --id <numeric-id>"
    );
    process.exit(1);
  }

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in env");
    process.exit(1);
  }
  const supabase = createClient(supabaseUrl, serviceRoleKey);

  // Resolve user id
  let userRow;
  if (idArg) {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, uid, email, full_name, username, balance, active_deposits, earned_money, created_at"
      )
      .eq("id", idArg)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Failed to fetch user by id:", error.message);
      process.exit(1);
    }
    userRow = data;
  } else {
    const { data, error } = await supabase
      .from("users")
      .select(
        "id, uid, email, full_name, username, balance, active_deposits, earned_money, created_at"
      )
      .eq("uid", uid)
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error("Failed to fetch user by uid:", error.message);
      process.exit(1);
    }
    userRow = data;
  }

  if (!userRow) {
    jlog({ event: "not_found", note: "No user record located" });
    process.exit(0);
  }

  const userId = Number(userRow.id);
  jlog({ event: "user", id: userId, uid: userRow.uid, email: userRow.email });

  // Fetch investments for this user
  const { data: activeInv, error: actErr } = await supabase
    .from("investments")
    .select("*")
    .eq("user_id", userId)
    .eq("status", "active");
  if (actErr) jlog({ event: "fetch_active_error", error: actErr.message });

  const { data: completedInv, error: compErr } = await supabase
    .from("completed_investments")
    .select("*")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(25);
  if (compErr) jlog({ event: "fetch_completed_error", error: compErr.message });

  // Fetch all investments for status overview
  const { data: allInv, error: allErr } = await supabase
    .from("investments")
    .select(
      "id, status, principal_amount, plan_name, start_date, end_date, created_at"
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (allErr)
    jlog({ event: "fetch_all_investments_error", error: allErr.message });

  // Optional: last few ledger entries
  let ledger = [];
  try {
    const { data: ledgerRows } = await supabase
      .from("financial_ledger")
      .select(
        "id, entry_type, amount_delta, active_deposits_delta, balance_after, active_deposits_after, reference_table, reference_id, created_at"
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20);
    ledger = ledgerRows || [];
  } catch {}

  // Compute discrepancies using shared math helpers
  const activeSummaries = (activeInv || []).map((inv) => {
    const principal = Number(inv.principal_amount || 0);
    const rate = Number(inv.daily_profit || 0);
    const dAmt = dailyAmount(principal, rate);
    const expected = expectedTotalActive(
      Number(inv.days_elapsed || 0),
      principal,
      rate
    );
    const reported = Number(inv.total_earned || 0);
    const diff = Number((reported - expected).toFixed(8));
    return {
      id: inv.id,
      plan: inv.plan_name,
      principal,
      dailyProfitPct: rate,
      dailyAmount: Number(dAmt.toFixed(8)),
      daysElapsed: inv.days_elapsed,
      expectedTotal: Number(expected.toFixed(8)),
      reportedTotal: Number(reported.toFixed(8)),
      discrepancy: Number(diff.toFixed(8)),
      start_date: inv.start_date,
      end_date: inv.end_date,
      first_profit_date: inv.first_profit_date,
      last_return_applied: inv.last_return_applied,
      status: inv.status,
    };
  });

  const completedSummaries = (completedInv || []).map((inv) => {
    const principal = Number(inv.principal_amount || 0);
    const rate = Number(inv.daily_profit || 0);
    const dAmt = dailyAmount(principal, rate);
    const expected = expectedTotalCompleted(
      Number(inv.duration || 0),
      principal,
      rate
    );
    const reported = Number(inv.total_earned || 0);
    const diff = Number((reported - expected).toFixed(8));
    return {
      id: inv.id,
      originalInvestmentId: inv.original_investment_id,
      plan: inv.plan_name,
      principal,
      duration: inv.duration,
      dailyProfitPct: rate,
      dailyAmount: Number(dAmt.toFixed(8)),
      expectedTotal: Number(expected.toFixed(8)),
      reportedTotal: Number(reported.toFixed(8)),
      discrepancy: Number(diff.toFixed(8)),
      completed_at: inv.completed_at,
    };
  });

  const activeDiscrepancies = activeSummaries.filter(
    (s) => Math.abs(s.discrepancy) > 1e-6
  ).length;
  const completedDiscrepancies = completedSummaries.filter(
    (s) => Math.abs(s.discrepancy) > 1e-6
  ).length;

  const out = {
    user: {
      id: userId,
      uid: userRow.uid,
      email: userRow.email,
      balance: Number(userRow.balance ?? 0),
      active_deposits: Number(userRow.active_deposits ?? 0),
      earned_money: Number(userRow.earned_money ?? 0),
      created_at: userRow.created_at,
    },
    investments: {
      total: (allInv || []).length,
      byStatus: (() => {
        const map = {};
        for (const inv of allInv || []) {
          const s = inv.status || "unknown";
          map[s] = map[s] || { count: 0, principalSum: 0 };
          map[s].count += 1;
          map[s].principalSum += Number(inv.principal_amount || 0);
        }
        // round numbers
        for (const k of Object.keys(map)) {
          map[k].principalSum = Number(map[k].principalSum.toFixed(8));
        }
        return map;
      })(),
      items: allInv || [],
    },
    active: {
      count: activeSummaries.length,
      items: activeSummaries,
      discrepancies: activeDiscrepancies,
    },
    completed: {
      count: completedSummaries.length,
      items: completedSummaries,
      discrepancies: completedDiscrepancies,
    },
    ledger: ledger,
  };

  // Print a compact summary + full details
  jlog({
    event: "summary",
    activeCount: out.active.count,
    completedCount: out.completed.count,
    activeDiscrepancies,
    completedDiscrepancies,
  });
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  jlog({ event: "fatal", error: e.message });
  process.exit(1);
});
