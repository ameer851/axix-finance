import { api } from "@/lib/api";

export interface InvestmentPlan {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number;
  returnRate: string;
  duration: string;
  features: string[];
  walletAddresses: {
    bitcoin: string;
    bitcoinCash: string;
    ethereum: string;
    bnb: string;
    usdt: string;
  };
}

export interface InvestmentCalculation {
  planId: string;
  planName: string;
  principalAmount: number;
  dailyReturn: number;
  totalReturn24h: number;
  totalReturn30d: number;
  totalReturnPlan: number;
  projectedBalance24h: number;
  projectedBalance30d: number;
  projectedBalanceEnd: number;
  durationDays: number;
  returnPercentage: number;
}

export interface InvestmentProjection {
  calculations: InvestmentCalculation[];
  currentBalance: number;
  recommendedPlan?: InvestmentCalculation;
}

/**
 * Calculate investment returns for a specific plan
 */
export function calculateInvestmentReturns(
  plan: InvestmentPlan,
  principalAmount: number,
  currentBalance: number = 0
): InvestmentCalculation {
  // Parse return rate (e.g., "5-8% Monthly" -> take average)
  const returnRateMatch = plan.returnRate.match(/(\d+)-(\d+)%/);
  const returnPercentage = returnRateMatch
    ? (parseInt(returnRateMatch[1]) + parseInt(returnRateMatch[2])) / 2
    : 5; // Default 5% if parsing fails

  // Parse duration (e.g., "3 Months" -> 90 days)
  const durationMatch = plan.duration.match(
    /(\d+)\s*(Month|Months|Day|Days|Year|Years)/i
  );
  let durationDays = 90; // Default 3 months
  if (durationMatch) {
    const value = parseInt(durationMatch[1]);
    const unit = durationMatch[2].toLowerCase();
    switch (unit) {
      case "day":
      case "days":
        durationDays = value;
        break;
      case "month":
      case "months":
        durationDays = value * 30;
        break;
      case "year":
      case "years":
        durationDays = value * 365;
        break;
    }
  }

  // Calculate daily return rate
  const dailyReturnRate = returnPercentage / 100 / 30; // Monthly rate converted to daily
  const dailyReturn = principalAmount * dailyReturnRate;

  // Calculate returns
  const totalReturn24h = dailyReturn * 1;
  const totalReturn30d = dailyReturn * 30;
  const totalReturnPlan = dailyReturn * durationDays;

  // Calculate projected balances
  const projectedBalance24h = currentBalance + principalAmount + totalReturn24h;
  const projectedBalance30d = currentBalance + principalAmount + totalReturn30d;
  const projectedBalanceEnd =
    currentBalance + principalAmount + totalReturnPlan;

  return {
    planId: plan.id,
    planName: plan.name,
    principalAmount,
    dailyReturn,
    totalReturn24h,
    totalReturn30d,
    totalReturnPlan,
    projectedBalance24h,
    projectedBalance30d,
    projectedBalanceEnd,
    durationDays,
    returnPercentage,
  };
}

/**
 * Get investment projections for all plans
 */
export async function getInvestmentProjections(
  principalAmount: number,
  currentBalance: number = 0
): Promise<InvestmentProjection> {
  try {
    const response = (await api.calculateInvestment(
      principalAmount,
      currentBalance
    )) as {
      calculations: any[];
      currentBalance: number;
      recommendedPlan?: any;
    };

    const calculations = response.calculations.map((calc: any) => ({
      planId: calc.planId,
      planName: calc.planName,
      principalAmount: calc.principalAmount,
      dailyReturn: calc.dailyReturn,
      totalReturn24h: calc.totalReturn24h,
      totalReturn30d: calc.totalReturn30d,
      totalReturnPlan: calc.totalReturnPlan,
      projectedBalance24h: calc.projectedBalance24h,
      projectedBalance30d: calc.projectedBalance30d,
      projectedBalanceEnd: calc.projectedBalanceEnd,
      durationDays: calc.durationDays,
      returnPercentage: calc.returnPercentage,
    }));

    return {
      calculations,
      currentBalance: response.currentBalance,
      recommendedPlan: response.recommendedPlan
        ? {
            planId: response.recommendedPlan.planId,
            planName: response.recommendedPlan.planName,
            principalAmount: response.recommendedPlan.principalAmount,
            dailyReturn: response.recommendedPlan.dailyReturn,
            totalReturn24h: response.recommendedPlan.totalReturn24h,
            totalReturn30d: response.recommendedPlan.totalReturn30d,
            totalReturnPlan: response.recommendedPlan.totalReturnPlan,
            projectedBalance24h: response.recommendedPlan.projectedBalance24h,
            projectedBalance30d: response.recommendedPlan.projectedBalance30d,
            projectedBalanceEnd: response.recommendedPlan.projectedBalanceEnd,
            durationDays: response.recommendedPlan.durationDays,
            returnPercentage: response.recommendedPlan.returnPercentage,
          }
        : undefined,
    };
  } catch (error) {
    console.error("Error calculating investment projections:", error);
    throw new Error("Failed to calculate investment projections");
  }
}

/**
 * Apply investment returns to user balance
 */
export async function applyInvestmentReturns(
  planId: string,
  principalAmount: number,
  daysElapsed: number = 1
): Promise<{
  success: boolean;
  newBalance: number;
  returnsEarned: number;
  message: string;
}> {
  try {
    const response = (await api.applyInvestmentReturns(
      planId,
      principalAmount,
      daysElapsed
    )) as {
      success: boolean;
      planId: string;
      principalAmount: number;
      returnsEarned: number;
      newBalance: number;
      daysElapsed: number;
      message: string;
    };

    return {
      success: response.success,
      newBalance: response.newBalance,
      returnsEarned: response.returnsEarned,
      message: response.message,
    };
  } catch (error) {
    console.error("Error applying investment returns:", error);
    return {
      success: false,
      newBalance: 0,
      returnsEarned: 0,
      message:
        error instanceof Error
          ? error.message
          : "Failed to apply investment returns",
    };
  }
}
