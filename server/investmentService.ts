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

/**
 * Create an investment record when a deposit with investment plan is completed
 */
export async function createInvestmentFromTransaction(
  transactionId: number
): Promise<Investment | null> {
  try {
    // Get transaction details
    const { data: transaction, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !transaction) {
      console.error("Transaction not found:", txError);
      return null;
    }

    // Check if this transaction has investment plan data
    if (!transaction.plan_name || !transaction.daily_profit) {
      return null; // Not an investment transaction
    }

    const plan = INVESTMENT_PLANS.find((p) => p.name === transaction.plan_name);
    if (!plan) {
      console.error("Investment plan not found:", transaction.plan_name);
      return null;
    }

    // Calculate investment dates
    const startDate = new Date(transaction.created_at);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + plan.duration);

    // Create investment record
    const { data: investment, error: invError } = await supabase
      .from("investments")
      .insert({
        user_id: transaction.user_id,
        transaction_id: transaction.id,
        plan_name: transaction.plan_name,
        plan_duration: transaction.plan_duration,
        daily_profit: transaction.daily_profit,
        total_return: transaction.total_return,
        principal_amount: parseFloat(transaction.amount),
        start_date: startDate.toISOString(),
        end_date: endDate.toISOString(),
        status: "active",
        days_elapsed: 0,
        total_earned: 0,
        first_profit_date: null, // Will be set when admin approves
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (invError) {
      console.error("Error creating investment:", invError);
      return null;
    }

    return {
      id: investment.id,
      userId: investment.user_id,
      transactionId: investment.transaction_id,
      planName: investment.plan_name,
      planDuration: investment.plan_duration,
      dailyProfit: investment.daily_profit,
      totalReturn: investment.total_return,
      principalAmount: investment.principal_amount,
      startDate: investment.start_date,
      endDate: investment.end_date,
      status: investment.status,
      daysElapsed: investment.days_elapsed,
      totalEarned: investment.total_earned,
      lastReturnApplied: investment.last_return_applied,
      firstProfitDate: investment.first_profit_date,
      createdAt: investment.created_at,
      updatedAt: investment.updated_at,
    };
  } catch (error) {
    console.error("Error creating investment from transaction:", error);
    return null;
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
      .eq("userId", userId)
      .order("returnDate", { ascending: false });

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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Get all active investments that haven't had returns applied today
    // Include investments that have first_profit_date due today
    const { data: investments, error } = await supabase
      .from("investments")
      .select("*")
      .eq("status", "active")
      .or(
        `last_return_applied.is.null,last_return_applied.lt.${today.toISOString()},first_profit_date.eq.${today.toISOString()}`
      );

    if (error) {
      console.error("Error fetching investments for returns:", error);
      return;
    }

    for (const investment of investments || []) {
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
    const startDate = new Date(investmentData.start_date);
    const endDate = new Date(investmentData.end_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Check if this is the first profit date (24 hours after approval)
    const firstProfitDate = investmentData.first_profit_date
      ? new Date(investmentData.first_profit_date)
      : null;

    let isFirstProfit = false;
    if (firstProfitDate && firstProfitDate.getTime() === today.getTime()) {
      isFirstProfit = true;
    }

    // Calculate days elapsed
    const daysElapsed = Math.floor(
      (today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysElapsed < 1 && !isFirstProfit) {
      return; // Investment hasn't started yet and not first profit time
    }

    if (today >= endDate) {
      // Investment completed
      await supabase
        .from("investments")
        .update({
          status: "completed",
          days_elapsed: daysElapsed,
          updated_at: new Date().toISOString(),
        })
        .eq("id", investmentData.id);
      return;
    }

    // Calculate daily return amount
    const dailyReturnAmount =
      investmentData.principal_amount * (investmentData.daily_profit / 100);

    // Apply return to user balance
    const { error: balanceError } = await supabase.rpc(
      "increment_user_balance",
      {
        user_id: investmentData.user_id,
        amount: dailyReturnAmount,
      }
    );

    if (balanceError) {
      console.error("Error updating user balance:", balanceError);
      return;
    }

    // Record the return (no email notification for profits)
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

    // Update investment record
    const newTotalEarned =
      (investmentData.total_earned || 0) + dailyReturnAmount;

    const updateData: any = {
      days_elapsed: daysElapsed,
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

    const profitType = isFirstProfit ? "first profit (24h)" : "daily return";
    console.log(
      `Applied ${profitType} of ${dailyReturnAmount} to investment ${investmentData.id}`
    );
  } catch (error) {
    console.error("Error applying investment return:", error);
  }
}

/**
 * Schedule the first profit for 24 hours after deposit approval
 */
export async function scheduleFirstProfit(
  investmentId: number
): Promise<boolean> {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0); // Set to start of day

    const { error } = await supabase
      .from("investments")
      .update({
        first_profit_date: tomorrow.toISOString(),
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
