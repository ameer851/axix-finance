import pg from "pg";
import {
  sendInvestmentCompletedEmail,
  sendInvestmentIncrementEmail,
} from "./emailService";
import { financialLedger } from "./financialLedger";
import { log } from "./logger";
import { supabase } from "./supabase";

// Investment types
export interface Investment {
  id: number;
  userId: number;
  transactionId: number;
  planName: string;
  planDuration: string;
  dailyProfit: number;
  totalReturn: number;
  principalAmount: number;
  startDate: string;
  endDate: string;
  status: "active" | "completed" | "cancelled";
  daysElapsed: number;
  totalEarned: number;
  lastReturnApplied?: string;
  firstProfitDate?: string; // 24-hour first profit date
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentReturn {
  id: number;
  investmentId: number;
  userId: number;
  amount: number;
  returnDate: string;
  createdAt: string;
}

// Investment plans configuration
export const INVESTMENT_PLANS = [
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

// Internal helper to support both real Supabase client and unit-test mock
async function execSingle<T = any>(
  qb: any
): Promise<{ data: T | null; error: any | null }> {
  // Unit tests provide a mock with an _exec() method
  if (qb && typeof qb._exec === "function") {
    const res = qb._exec();
    return { data: res.data ?? null, error: res.error ?? null };
  }
  // Real client returns a promise with { data, error }
  const res = await qb;
  return { data: res?.data ?? null, error: res?.error ?? null };
}

/**
 * Create an investment record when a deposit with investment plan is completed
 */
export async function createInvestmentFromTransactionRecord(
  transactionId: number,
  planId?: string,
  options?: { skipActiveDepositsIncrement?: boolean }
): Promise<Investment | null> {
  try {
    // Get transaction details
    const qTx = supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();
    const { data: transaction, error: txError } = await execSingle(qTx);

    if (txError || !transaction) {
      return null;
    }

    if (transaction.status !== "completed") {
      return null;
    }

    // Check if an investment already exists for this transaction
    const qExisting = supabase
      .from("investments")
      .select("id")
      .eq("transaction_id", transactionId)
      .single();
    const { data: existingInvestment, error: existingInvError } =
      await execSingle(qExisting);

    if (existingInvError && existingInvError.code !== "PGRST116") {
      // PGRST116: "exact one row not found" - this is expected
      console.error(
        "Error checking for existing investment:",
        existingInvError
      );
      return null;
    }

    if (existingInvestment) {
      return null;
    }

    // Resolve plan details
    let plan = planId
      ? INVESTMENT_PLANS.find((p) => p.id === planId)
      : undefined;
    // Fallback by plan name stored on transaction
    if (!plan) {
      const txPlanName =
        (transaction as any).plan_name || (transaction as any).planName;
      if (txPlanName) {
        plan = INVESTMENT_PLANS.find((p) => p.name === txPlanName);
      }
    }

    const amount = parseFloat(transaction.amount);
    // Basic validation if plan is available
    if (plan) {
      if (
        amount < plan.minAmount ||
        (plan.maxAmount && amount > plan.maxAmount)
      ) {
        return null;
      }
    }

    // Resolve numeric user id
    let numericUserId: number | null = null;
    if (typeof (transaction as any).user_id === "number") {
      numericUserId = Number((transaction as any).user_id);
    } else if (typeof (transaction as any).user_id === "string") {
      const { data: userRow, error: userErr } = await supabase
        .from("users")
        .select("id")
        .eq("uid", (transaction as any).user_id)
        .single();
      if (userErr || !userRow) {
        return null;
      }
      numericUserId = Number(userRow.id);
    }

    if (!numericUserId) {
      return null;
    }

    // Calculate investment dates
    const startDate = new Date(transaction.created_at);
    const endDate = new Date(startDate);
    const numericDuration = (() => {
      if (plan) return plan.duration;
      const raw =
        (transaction as any).plan_duration || (transaction as any).planDuration;
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        const m = raw.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      }
      return 0;
    })();
    endDate.setDate(endDate.getDate() + numericDuration);

    // Create investment record
    const { data: inserted, error: invError } = await supabase
      .from("investments")
      .insert({
        user_id: numericUserId,
        transaction_id: transaction.id,
        plan_name:
          (plan && plan.name) ||
          (transaction as any).plan_name ||
          (transaction as any).planName ||
          "UNKNOWN",
        plan_duration: numericDuration,
        daily_profit:
          (plan && plan.dailyProfit) ||
          Number(
            (transaction as any).daily_profit ||
              (transaction as any).dailyProfit ||
              0
          ),
        total_return:
          (plan && plan.totalReturn) ||
          Number(
            (transaction as any).total_return ||
              (transaction as any).totalReturn ||
              0
          ),
        principal_amount: amount,
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        days_elapsed: 0,
        total_earned: 0,
      });

    if (invError) {
      console.error("Error creating investment:", invError);
      return null;
    }
    const investment: any = Array.isArray(inserted) ? inserted[0] : inserted;

    // Optionally update the user's active_deposits (skip for reinvest flow where it's already moved)
    const skipIncrement = options?.skipActiveDepositsIncrement === true;
    try {
      if (!skipIncrement) {
        await supabase.rpc("increment_user_active_deposits", {
          user_id_input: numericUserId,
          amount_input: amount,
        });
      }
    } catch (incErr) {
      console.warn("increment_user_active_deposits RPC failed", incErr);
    }
    return investment as Investment;
  } catch (error) {
    console.error("Error creating investment from transaction:", error);
    return null;
  }
}

// Backward-compatible wrapper used by existing tests and some admin endpoints
export async function createInvestmentFromTransaction(
  transactionId: number,
  planId?: string,
  options?: { skipActiveDepositsIncrement?: boolean }
): Promise<{ success: boolean; investment?: Investment; error?: string }> {
  try {
    // Load transaction first to produce detailed errors for tests/callers
    const qTx = supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();
    const { data: transaction, error: txError } = await execSingle(qTx);
    if (txError || !transaction) {
      return { success: false, error: "Transaction not found" };
    }
    if (transaction.status !== "completed") {
      return { success: false, error: "Transaction not completed" };
    }
    // Duplicate check
    const qExisting = supabase
      .from("investments")
      .select("id")
      .eq("transaction_id", transactionId)
      .single();
    const { data: existingInvestment, error: existingInvError } =
      await execSingle(qExisting);
    if (!existingInvError && existingInvestment) {
      return {
        success: false,
        error: "Investment already created for this transaction",
      };
    }
    // Resolve plan and validate amount if possible
    let plan = planId
      ? INVESTMENT_PLANS.find((p) => p.id === planId)
      : undefined;
    if (!plan) {
      const txPlanName =
        (transaction as any).plan_name || (transaction as any).planName;
      if (txPlanName)
        plan = INVESTMENT_PLANS.find((p) => p.name === txPlanName);
    }
    if (!plan) {
      return { success: false, error: "Investment plan not found" };
    }
    const amount = parseFloat(transaction.amount);
    if (
      amount < plan.minAmount ||
      (plan.maxAmount && amount > plan.maxAmount)
    ) {
      return { success: false, error: "Amount is not within plan limits" };
    }
    // Delegate to creator
    const inv = await createInvestmentFromTransactionRecord(
      transactionId,
      plan.id,
      options
    );
    if (inv) return { success: true, investment: inv };
    return { success: false, error: "Failed to create investment record" };
  } catch (e: any) {
    return { success: false, error: e?.message || "Internal error" };
  }
}

/**
 * Get all active investments for a user
 */
export async function getUserInvestments(
  userId: number
): Promise<Investment[]> {
  try {
    const { data: investments, error } = await supabase
      .from("investments")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "active")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching user investments:", error);
      return [];
    }

    return investments.map((inv) => ({
      id: inv.id,
      userId: inv.user_id,
      transactionId: inv.transaction_id,
      planName: inv.plan_name,
      planDuration: inv.plan_duration,
      dailyProfit: inv.daily_profit,
      totalReturn: inv.total_return,
      principalAmount: inv.principal_amount,
      startDate: inv.start_date,
      endDate: inv.end_date,
      status: inv.status,
      daysElapsed: inv.days_elapsed,
      totalEarned: inv.total_earned,
      lastReturnApplied: inv.last_return_applied,
      firstProfitDate: inv.first_profit_date,
      createdAt: inv.created_at,
      updatedAt: inv.updated_at,
    }));
  } catch (error) {
    console.error("Error fetching user investments:", error);
    return [];
  }
}

/**
 * Get user's investment returns
 */
export async function getUserInvestmentReturns(
  userId: number
): Promise<InvestmentReturn[]> {
  try {
    const { data: returns, error } = await supabase
      .from("investment_returns")
      .select("*")
      .eq("user_id", userId)
      .order("return_date", { ascending: false });

    if (error) {
      console.error("Error fetching user investment returns:", error);
      return [];
    }

    return returns || [];
  } catch (error) {
    console.error("Error fetching user investment returns:", error);
    return [];
  }
}

/**
 * Apply daily returns to active investments
 */
export async function applyDailyReturns(): Promise<void> {
  try {
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Get all active investments that haven't had returns applied today
    // Include investments that have first_profit_date due today
    const { data: investments, error } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "active")
      .or(
        `last_return_applied.is.null,last_return_applied.lt.${today.toISOString()},first_profit_date.lte.${today.toISOString()}`
      );

    if (error) {
      console.error("Error fetching investments for returns:", error);
      return;
    }

    for (const investment of investments || []) {
      // Debug selection window
      try {
        const lra = investment.last_return_applied
          ? new Date(investment.last_return_applied)
          : null;
        const fpd = investment.first_profit_date
          ? new Date(investment.first_profit_date)
          : null;
        console.log(
          "[applyDailyReturns] considering investment",
          investment.id,
          {
            today: today.toISOString(),
            last_return_applied: lra ? lra.toISOString() : null,
            first_profit_date: fpd ? fpd.toISOString() : null,
          }
        );
      } catch {}
      await applyInvestmentReturn(investment);
    }
  } catch (error) {
    console.error("Error applying daily returns:", error);
  }
}

/**
 * Apply return for a specific investment
 */
export async function applyInvestmentReturn(
  investmentData: any
): Promise<void> {
  try {
    // Cutover: Investments starting on/after this UTC date will credit earnings only upon completion
    const CREDIT_POLICY_CUTOFF_ISO = "2025-09-18T00:00:00Z";
    const creditOnCompletionOnly =
      new Date(investmentData.start_date).getTime() >=
      new Date(CREDIT_POLICY_CUTOFF_ISO).getTime();

    const startDate = new Date(investmentData.start_date);
    const endDate = new Date(investmentData.end_date);
    const now = new Date();
    const today = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate())
    );

    // Check if this is the first profit date (24 hours after approval)
    const firstProfitDate = investmentData.first_profit_date
      ? new Date(investmentData.first_profit_date)
      : null;

    let isFirstProfit = false;
    if (firstProfitDate && firstProfitDate.getTime() <= today.getTime()) {
      isFirstProfit = true;
    }

    // Calculate calendar days since start for eligibility (first day guarded by first_profit_date)
    const daysSinceStart = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysSinceStart < 1 && !isFirstProfit) {
      return; // Investment hasn't started yet and not first profit time
    }

    // Parse plan duration (string like "3 days" or numeric)
    const planDuration: number = (() => {
      const raw = investmentData.plan_duration;
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        const m = raw.match(/(\d+)/);
        return m ? parseInt(m[1], 10) : 0;
      }
      return 0;
    })();

    // Number of daily profits applied so far (we use days_elapsed as counter)
    const appliedCount = Number(investmentData.days_elapsed || 0);
    if (appliedCount >= planDuration) {
      // Already fully accrued; ensure completion path finishes principal unlock/archive
      // Fall through to completion handler below
    }

    // Calculate daily return amount
    const dailyReturnAmount =
      investmentData.principal_amount * (investmentData.daily_profit / 100);

    // Decide if we should apply a daily return today (not exceeding plan duration)
    let didApplyReturn = false;
    let newTotalEarned = Number(investmentData.total_earned || 0);
    let newAppliedCount = appliedCount;
    if (
      // Apply if not already applied today and we still have days left
      (!investmentData.last_return_applied ||
        new Date(investmentData.last_return_applied).getTime() <
          today.getTime()) &&
      appliedCount < planDuration
    ) {
      // Apply return: do NOT credit user balance daily for new investments (post-cutoff)
      if (!creditOnCompletionOnly) {
        // Legacy behavior: credit user balance daily (pre-cutoff investments)
        const { error: balanceError } = await supabase.rpc(
          "increment_user_balance",
          {
            user_id: investmentData.user_id,
            amount: dailyReturnAmount,
          }
        );

        if (balanceError) {
          // Fallback: if RPC is missing, increment balance directly
          const isMissingRpc =
            (balanceError as any)?.code === "PGRST202" ||
            /Could not find the function\s+public\.increment_user_balance/i.test(
              String((balanceError as any)?.message || "")
            );
          if (isMissingRpc) {
            try {
              const { data: userRow, error: userErr } = await supabase
                .from("users")
                .select("id, balance")
                .eq("id", investmentData.user_id)
                .single();
              if (userErr || !userRow) {
                console.error("Fallback balance fetch failed:", userErr);
                return;
              }
              const current = Number(userRow.balance || 0);
              const updated = current + Number(dailyReturnAmount || 0);
              const { error: updErr } = await supabase
                .from("users")
                .update({ balance: String(updated) })
                .eq("id", userRow.id);
              if (updErr) {
                console.error("Fallback balance update failed:", updErr);
                return;
              }
            } catch (e) {
              console.error("Fallback balance update exception:", e);
              return;
            }
          } else {
            console.error("Error updating user balance:", balanceError);
            return;
          }
        }
      }

      // Record the return
      const { error: returnError } = await supabase
        .from("investment_returns")
        .insert({
          investment_id: investmentData.id,
          user_id: investmentData.user_id,
          amount: dailyReturnAmount,
          return_date: today.toISOString(),
          created_at: new Date().toISOString(),
        });

      if (returnError) {
        console.error("Error recording investment return:", returnError);
        return;
      }

      // Update investment record: increment applied count and totals
      newAppliedCount = appliedCount + 1;
      newTotalEarned = newTotalEarned + dailyReturnAmount;

      const updateData: any = {
        days_elapsed: newAppliedCount,
        total_earned: newTotalEarned,
        last_return_applied: today.toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Clear first_profit_date after applying first profit
      if (isFirstProfit) {
        updateData.first_profit_date = null;
      }

      await supabase
        .from("investments")
        .update(updateData)
        .eq("id", investmentData.id);

      didApplyReturn = true;

      const profitType = isFirstProfit ? "first profit (24h)" : "daily return";
      console.log(
        `Applied ${profitType} of ${dailyReturnAmount} to investment ${investmentData.id}`
      );

      // Attempt to send increment email; idempotence is ensured by last_return_applied date update
      try {
        const { data: user } = await supabase
          .from("users")
          .select("id, uid, email, username, first_name, full_name, balance")
          .eq("id", investmentData.user_id)
          .single();
        if (user && user.email) {
          const nextDayUtc = new Date(today);
          nextDayUtc.setUTCDate(nextDayUtc.getUTCDate() + 1);
          await sendInvestmentIncrementEmail(user as any, {
            planName: investmentData.plan_name,
            day: newAppliedCount,
            duration: planDuration || newAppliedCount,
            dailyAmount: dailyReturnAmount,
            totalEarned: newTotalEarned,
            principal: investmentData.principal_amount || 0,
            nextAccrualUtc: nextDayUtc.toISOString(),
          });
        }
      } catch (e) {
        console.warn("[investments] increment email failed", {
          investmentId: investmentData.id,
          error: (e as any)?.message,
        });
      }
    }

    // If we've reached or exceeded plan duration after today's accrual, complete the investment
    const shouldComplete = newAppliedCount >= planDuration || today >= endDate;
    if (shouldComplete) {
      await completeInvestmentTransactionally(investmentData, {
        planDuration,
        totalEarnedAtCompletion: newTotalEarned,
        creditOnCompletionOnly,
      });
      return;
    }

    const profitType = isFirstProfit ? "first profit (24h)" : "daily return";
    console.log(
      `Applied ${profitType} of ${dailyReturnAmount} to investment ${investmentData.id}`
    );

    // If we didn't apply or complete (shouldn't generally happen), fall through
  } catch (error) {
    console.error("Error applying investment return:", error);
  }
}

interface CompletionContext {
  planDuration: number;
  totalEarnedAtCompletion: number;
  creditOnCompletionOnly: boolean;
}

async function completeInvestmentTransactionally(
  investmentData: any,
  ctx: CompletionContext
) {
  // Fault injection (test-only): if env flag set to 'before-user-update' or 'after-user-update', throw to simulate partial failure paths.
  const faultPoint = process.env.TEST_FAIL_AFTER_PRINCIPAL_UNLOCK;
  const serviceDbUrl = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;
  const canTransact = !!serviceDbUrl;
  const client = canTransact
    ? new pg.Client({ connectionString: serviceDbUrl })
    : null;
  const nowIso = new Date().toISOString();
  try {
    if (client) await client.connect();
    if (client) await client.query("BEGIN");

    // Lock user & investment rows (if using pg client) to prevent race double-completion
    let userRow: any = null;
    if (client) {
      const userRes = await client.query(
        "SELECT id, balance, active_deposits FROM users WHERE id = $1 FOR UPDATE",
        [investmentData.user_id]
      );
      userRow = userRes.rows[0];
      const invRes = await client.query(
        "SELECT id, status FROM investments WHERE id = $1 FOR UPDATE",
        [investmentData.id]
      );
      const invStatus = invRes.rows[0]?.status;
      if (invStatus === "completed") {
        if (client) await client.query("ROLLBACK");
        return; // already completed
      }
    } else {
      const { data: fetchedUser } = await supabase
        .from("users")
        .select("id,balance,active_deposits")
        .eq("id", investmentData.user_id)
        .single();
      userRow = fetchedUser;
    }

    // Update investment status
    if (client) {
      await client.query(
        "UPDATE investments SET status = $1, updated_at = $2 WHERE id = $3",
        ["completed", nowIso, investmentData.id]
      );
    } else {
      await supabase
        .from("investments")
        .update({ status: "completed", updated_at: nowIso })
        .eq("id", investmentData.id);
    }

    // Adjust active deposits & optionally credit earnings
    const principal = Number(investmentData.principal_amount || 0);
    const earned = Number(ctx.totalEarnedAtCompletion || 0);
    let nextBalance = Number(userRow?.balance || 0);
    let nextActive = Number(userRow?.active_deposits || 0) - principal;
    if (nextActive < 0) nextActive = 0;
    if (ctx.creditOnCompletionOnly) {
      nextBalance += earned; // credit all accrued earnings now
    }
    // Always unlock principal back to balance
    nextBalance += principal;

    if (client) {
      await client.query(
        "UPDATE users SET balance = $1, active_deposits = $2, updated_at = $3 WHERE id = $4",
        [
          String(nextBalance),
          String(nextActive),
          nowIso,
          investmentData.user_id,
        ]
      );
    } else {
      await supabase
        .from("users")
        .update({
          balance: String(nextBalance),
          active_deposits: String(nextActive),
          updated_at: nowIso,
        })
        .eq("id", investmentData.user_id);
    }

    if (faultPoint === "after-user-update") {
      throw new Error("Injected failure after user update");
    }

    // Archive snapshot
    if (client) {
      await client.query(
        "INSERT INTO completed_investments (original_investment_id,user_id,plan_name,daily_profit,duration,principal_amount,total_earned,start_date,end_date,completed_at,created_at) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$10)",
        [
          investmentData.id,
          investmentData.user_id,
          investmentData.plan_name,
          investmentData.daily_profit,
          ctx.planDuration,
          investmentData.principal_amount,
          earned,
          investmentData.start_date,
          investmentData.end_date,
          nowIso,
        ]
      );
    } else {
      await supabase.from("completed_investments").insert({
        original_investment_id: investmentData.id,
        user_id: investmentData.user_id,
        plan_name: investmentData.plan_name,
        daily_profit: investmentData.daily_profit,
        duration: ctx.planDuration,
        principal_amount: investmentData.principal_amount,
        total_earned: earned,
        start_date: investmentData.start_date,
        end_date: investmentData.end_date,
        completed_at: nowIso,
      });
    }

    if (faultPoint === "after-archive") {
      throw new Error("Injected failure after archive");
    }

    // Ledger entries (principal unlock + earnings credit aggregated) using supabase client only (out-of-tx, acceptable; or we could skip when client exists)
    try {
      await financialLedger.record({
        userId: investmentData.user_id,
        entryType: "investment_completion",
        amountDelta:
          principal + (ctx.creditOnCompletionOnly ? earned : principal),
        activeDepositsDelta: -principal,
        balanceAfter: nextBalance,
        activeDepositsAfter: nextActive,
        referenceTable: "investments",
        referenceId: investmentData.id,
        metadata: {
          earned,
          creditOnCompletionOnly: ctx.creditOnCompletionOnly,
        },
      });
    } catch (e) {
      log.error("ledger.record.completion.fail", e, {
        investmentId: investmentData.id,
      });
    }

    if (client) await client.query("COMMIT");

    // Send completion email (outside transaction)
    try {
      const { data: user } = await supabase
        .from("users")
        .select("id,email,username,first_name,full_name,balance")
        .eq("id", investmentData.user_id)
        .single();
      if (user && (user as any).email) {
        await sendInvestmentCompletedEmail(user as any, {
          planName: investmentData.plan_name,
          duration: ctx.planDuration,
          totalEarned: earned,
          principal: investmentData.principal_amount || 0,
          endDateUtc: investmentData.end_date,
        });
      }
    } catch (e) {
      log.warn("completion.email.fail", {
        investmentId: investmentData.id,
        error: (e as any)?.message,
      });
    }
  } catch (e) {
    if (client) {
      try {
        await client.query("ROLLBACK");
      } catch {}
    }
    log.error("investment.complete.tx.fail", e, {
      investmentId: investmentData.id,
    });
  } finally {
    if (client) {
      try {
        await client.end();
      } catch {}
    }
  }
}

/**
 * Schedule the first profit for 24 hours after deposit approval
 */
export async function scheduleFirstProfit(
  investmentId: number
): Promise<boolean> {
  try {
    // Compute tomorrow at UTC start-of-day to avoid local timezone/DST issues
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
      console.error("Error scheduling first profit:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error scheduling first profit:", error);
    return false;
  }
}
