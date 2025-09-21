// Shared daily investment returns job logic
// This module encapsulates the core processing so both the cron script and admin manual trigger reuse identical logic.
import { createClient } from "@supabase/supabase-js";
// Optional lazy email imports only when needed to avoid bundling if not configured

// Lightweight structured logger
export function jobLog(fields) {
  try {
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      job: "daily-investments",
      ...fields,
    });
    console.log(line);
  } catch (e) {
    console.log("[jobLog-fallback]", fields);
  }
}

function utcStartOfDay(d) {
  return new Date(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate())
  );
}

/**
 * Run the daily investment job.
 * @param {Object} opts
 * @param {string} opts.supabaseUrl
 * @param {string} opts.serviceRoleKey
 * @param {boolean} [opts.dryRun]
 * @param {string} [opts.source] - 'cron' | 'manual' | 'api'
 * @param {function} [opts.sendEmail] - optional email sender ({ to, subject, html, headers }) => Promise<boolean>
 * @param {boolean} [opts.sendIncrementEmails] - send daily increment emails
 * @param {boolean} [opts.sendCompletionEmails] - send completion emails
 * @param {boolean} [opts.forceCreditOnCompletionOnly] - override policy to credit only at completion
 * @returns {Promise<{ processed:number, completed:number, totalApplied:number }>} metrics
 */
export async function runDailyInvestmentJob(opts) {
  const {
    supabaseUrl,
    serviceRoleKey,
    dryRun = false,
    source = "cron",
    sendEmail,
    sendIncrementEmails = false,
    sendCompletionEmails = true,
    forceCreditOnCompletionOnly = false,
  } = opts;
  const supabase = createClient(supabaseUrl, serviceRoleKey);
  const startTs = Date.now();

  const now = new Date();
  const todayUtc = utcStartOfDay(now);
  const todayIso = todayUtc.toISOString();
  const CREDIT_POLICY_CUTOFF_ISO = "2025-09-18T00:00:00Z";

  jobLog({ event: "start", dryRun, source, todayIso });

  // Record start row (best-effort)
  let jobRunId = null;
  try {
    const { data, error } = await supabase
      .from("job_runs")
      .insert({
        job_name: "daily-investments",
        source,
        meta: { dryRun, sendIncrementEmails, sendCompletionEmails },
      })
      .select("id")
      .single();
    if (!error && data) jobRunId = data.id;
    else if (error)
      jobLog({ event: "job_runs_insert_error", error: error.message });
  } catch (e) {
    jobLog({ event: "job_runs_insert_exception", error: e.message });
  }

  const { data: investments, error } = await supabase
    .from("investments")
    .select("*")
    .eq("status", "active")
    .or(
      `last_return_applied.is.null,last_return_applied.lt.${todayIso},first_profit_date.lte.${todayIso}`
    );
  if (error) {
    jobLog({ event: "fetch_error", error: error.message });
    await finalize(false, 0, 0, 0, error.message);
    return { processed: 0, completed: 0, totalApplied: 0 };
  }

  if (!investments || investments.length === 0) {
    jobLog({ event: "nothing_to_process" });
    await finalize(true, 0, 0, 0, null);
    return { processed: 0, completed: 0, totalApplied: 0 };
  }

  jobLog({ event: "found_investments", count: investments.length });
  let processed = 0;
  let completed = 0;
  let totalApplied = 0;

  async function fetchUserBasic(userId) {
    try {
      const { data } = await supabase
        .from("users")
        .select("id,email,username")
        .eq("id", userId)
        .single();
      return data || null;
    } catch {
      return null;
    }
  }

  async function unlockPrincipalAndArchive(
    inv,
    totalEarnedAtCompletion,
    endDateIso
  ) {
    try {
      // Skip if snapshot exists already
      const { data: existing } = await supabase
        .from("completed_investments")
        .select("id")
        .eq("original_investment_id", inv.id)
        .limit(1);
      if (existing && existing.length > 0) return;

      // Credit all earned + principal back to user balance and reduce active deposits
      const { data: userRow } = await supabase
        .from("users")
        .select("id,balance,active_deposits")
        .eq("id", inv.user_id)
        .single();
      if (userRow) {
        const earned = Number(totalEarnedAtCompletion || 0);
        const principal = Number(inv.principal_amount || 0);
        const nextBalance = Number(userRow.balance || 0) + earned + principal;
        const currentActive = Number(userRow.active_deposits || 0);
        const nextActive = Math.max(0, currentActive - principal);
        const { error: updateError } = await supabase
          .from("users")
          .update({
            balance: String(nextBalance),
            active_deposits: String(nextActive),
          })
          .eq("id", userRow.id);
        if (updateError) {
          jobLog({
            event: "completion_balance_update_failed",
            investment: inv.id,
            user: userRow.id,
            error: updateError.message,
          });
        } else {
          jobLog({
            event: "completion_balance_update_success",
            investment: inv.id,
            user: userRow.id,
            earned,
            principal,
            finalBalance: nextBalance,
          });
        }
      }

      if (!dryRun) {
        await supabase.from("completed_investments").insert({
          original_investment_id: inv.id,
          user_id: inv.user_id,
          plan_name: inv.plan_name,
          daily_profit: inv.daily_profit,
          duration: Number(inv.plan_duration || 0),
          principal_amount: inv.principal_amount,
          total_earned: totalEarnedAtCompletion,
          start_date: inv.start_date,
          end_date: endDateIso,
          completed_at: new Date().toISOString(),
        });

        await supabase
          .from("investments")
          .update({ status: "completed", total_earned: "0" })
          .eq("id", inv.id);
      }
    } catch (e) {
      jobLog({
        event: "archive_exception",
        investment: inv.id,
        error: e.message,
      });
    }
  }

  for (const inv of investments) {
    try {
      const creditOnCompletionOnly = forceCreditOnCompletionOnly
        ? true
        : new Date(inv.start_date).getTime() >=
          new Date(CREDIT_POLICY_CUTOFF_ISO).getTime();
      const lastApplied = inv.last_return_applied
        ? new Date(inv.last_return_applied)
        : null;
      if (lastApplied && lastApplied.getTime() >= todayUtc.getTime()) continue;

      const firstProfitDate = inv.first_profit_date
        ? new Date(inv.first_profit_date)
        : null;
      const isFirstProfit =
        !!firstProfitDate && firstProfitDate.getTime() <= todayUtc.getTime();
      const appliedCount = Number(inv.days_elapsed || 0);
      const duration = Number(inv.plan_duration || 0);
      jobLog({
        event: "consider",
        id: inv.id,
        user: inv.user_id,
        appliedCount,
        duration,
        creditOnCompletionOnly,
        isFirstProfit,
      });
      if (appliedCount >= duration) {
        if (!dryRun) {
          await supabase
            .from("investments")
            .update({
              status: "completed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", inv.id);
          // If policy is credit-on-completion-only we must credit all accumulated earnings now (they were not credited daily)
          const creditOnCompletionOnly = forceCreditOnCompletionOnly
            ? true
            : new Date(inv.start_date).getTime() >=
              new Date(CREDIT_POLICY_CUTOFF_ISO).getTime();
          if (creditOnCompletionOnly) {
            try {
              const totalEarned = Number(inv.total_earned || 0);
              if (totalEarned > 0) {
                const { data: userRow } = await supabase
                  .from("users")
                  .select("id,balance")
                  .eq("id", inv.user_id)
                  .single();
                if (userRow) {
                  const nextBalance =
                    Number(userRow.balance || 0) + totalEarned;
                  const { error: balErr } = await supabase
                    .from("users")
                    .update({ balance: String(nextBalance) })
                    .eq("id", userRow.id);
                  if (balErr) {
                    jobLog({
                      event: "completion_credit_failed",
                      investment: inv.id,
                      user: inv.user_id,
                      error: balErr.message,
                    });
                  } else {
                    jobLog({
                      event: "completion_credit_success",
                      investment: inv.id,
                      user: inv.user_id,
                      amount: totalEarned,
                    });
                  }
                }
              }
            } catch (e) {
              jobLog({
                event: "completion_credit_exception",
                investment: inv.id,
                error: e.message,
              });
            }
          }
          await unlockPrincipalAndArchive(
            inv,
            Number(inv.total_earned || 0),
            new Date().toISOString()
          );
          if (sendCompletionEmails) {
            try {
              const userBasic = await fetchUserBasic(inv.user_id);
              if (userBasic) {
                const { sendInvestmentCompletedEmail } = await import(
                  "../server/emailService.js"
                );
                await sendInvestmentCompletedEmail(userBasic, {
                  planName: inv.plan_name || "Investment Plan",
                  duration: Number(inv.plan_duration || 0),
                  totalEarned: Number(inv.total_earned || 0),
                  principal: Number(inv.principal_amount || 0),
                  endDateUtc: new Date().toISOString(),
                });
              }
            } catch (e) {
              jobLog({
                event: "completion_email_error",
                investment: inv.id,
                error: e.message,
              });
            }
          }
        }
        completed++;
        continue;
      }
      const dailyAmount =
        Number(inv.principal_amount || 0) *
        (Number(inv.daily_profit || 0) / 100);
      if (!dryRun) {
        if (!creditOnCompletionOnly) {
          const { data: user } = await supabase
            .from("users")
            .select("id,balance")
            .eq("id", inv.user_id)
            .single();
          if (user) {
            const nextBalance =
              Number(user.balance || 0) + Number(dailyAmount || 0);
            await supabase
              .from("users")
              .update({ balance: String(nextBalance) })
              .eq("id", inv.user_id);
          }
        }
        const updateData = {
          days_elapsed: appliedCount + 1,
          total_earned:
            Number(inv.total_earned || 0) + Number(dailyAmount || 0),
          last_return_applied: todayIso,
          updated_at: new Date().toISOString(),
        };
        if (isFirstProfit) updateData.first_profit_date = null;
        await supabase.from("investments").update(updateData).eq("id", inv.id);
        await supabase.from("investment_returns").insert({
          investment_id: inv.id,
          user_id: inv.user_id,
          amount: Number(dailyAmount || 0),
          return_date: todayIso,
          created_at: new Date().toISOString(),
        });
        if (!creditOnCompletionOnly && sendIncrementEmails) {
          try {
            const userBasic = await fetchUserBasic(inv.user_id);
            if (userBasic) {
              const { sendInvestmentIncrementEmail } = await import(
                "../server/emailService.js"
              );
              await sendInvestmentIncrementEmail(userBasic, {
                planName: inv.plan_name || "Investment Plan",
                day: appliedCount + 1,
                duration: Number(inv.plan_duration || 0),
                dailyAmount: Number(dailyAmount || 0),
                totalEarned:
                  Number(inv.total_earned || 0) + Number(dailyAmount || 0),
                principal: Number(inv.principal_amount || 0),
                nextAccrualUtc: null,
              });
            }
          } catch (e) {
            jobLog({
              event: "increment_email_error",
              investment: inv.id,
              error: e.message,
            });
          }
        }
      }
      processed++;
      totalApplied += Number(dailyAmount || 0);
      if (appliedCount + 1 >= duration && !dryRun) {
        await supabase
          .from("investments")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", inv.id);
        completed++;
        const creditOnCompletionOnly = forceCreditOnCompletionOnly
          ? true
          : new Date(inv.start_date).getTime() >=
            new Date(CREDIT_POLICY_CUTOFF_ISO).getTime();
        if (creditOnCompletionOnly) {
          try {
            const totalEarnedAtCompletion =
              Number(inv.total_earned || 0) + Number(dailyAmount || 0);
            if (totalEarnedAtCompletion > 0) {
              const { data: userRow } = await supabase
                .from("users")
                .select("id,balance")
                .eq("id", inv.user_id)
                .single();
              if (userRow) {
                const nextBalance =
                  Number(userRow.balance || 0) + totalEarnedAtCompletion;
                const { error: balErr } = await supabase
                  .from("users")
                  .update({ balance: String(nextBalance) })
                  .eq("id", userRow.id);
                if (balErr) {
                  jobLog({
                    event: "completion_credit_failed",
                    investment: inv.id,
                    user: inv.user_id,
                    error: balErr.message,
                  });
                } else {
                  jobLog({
                    event: "completion_credit_success",
                    investment: inv.id,
                    user: inv.user_id,
                    amount: totalEarnedAtCompletion,
                  });
                }
              }
            }
          } catch (e) {
            jobLog({
              event: "completion_credit_exception",
              investment: inv.id,
              error: e.message,
            });
          }
        }
        await unlockPrincipalAndArchive(
          inv,
          Number(inv.total_earned || 0) + Number(dailyAmount || 0),
          new Date().toISOString()
        );
        if (sendCompletionEmails) {
          try {
            const userBasic = await fetchUserBasic(inv.user_id);
            if (userBasic) {
              const { sendInvestmentCompletedEmail } = await import(
                "../server/emailService.js"
              );
              await sendInvestmentCompletedEmail(userBasic, {
                planName: inv.plan_name || "Investment Plan",
                duration: Number(inv.plan_duration || 0),
                totalEarned:
                  Number(inv.total_earned || 0) + Number(dailyAmount || 0),
                principal: Number(inv.principal_amount || 0),
                endDateUtc: new Date().toISOString(),
              });
            }
          } catch (e) {
            jobLog({
              event: "completion_email_error",
              investment: inv.id,
              error: e.message,
            });
          }
        }
      }
    } catch (e) {
      jobLog({ event: "investment_exception", id: inv.id, error: e.message });
    }
  }

  jobLog({ event: "summary", processed, completed, totalApplied });
  await finalize(true, processed, completed, totalApplied, null);
  return { processed, completed, totalApplied };

  async function finalize(
    success,
    processedCount,
    completedCount,
    applied,
    errorText
  ) {
    if (!jobRunId) return;
    try {
      await supabase
        .from("job_runs")
        .update({
          finished_at: new Date().toISOString(),
          success,
          processed_count: processedCount,
          completed_count: completedCount,
          total_applied: applied,
          error_text: errorText || null,
        })
        .eq("id", jobRunId);
    } catch (e) {
      jobLog({ event: "finalize_exception", error: e.message, jobRunId });
    }
  }
}
