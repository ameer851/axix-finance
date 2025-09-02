import { api } from "@/lib/api";
import { type InvestmentPlan } from "./investmentService";

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
  minAmount: number;
  maxAmount: number | null;
  totalReturnPercentage: number;
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
  // Calculate daily return
  const dailyReturn = (principalAmount * plan.dailyProfit) / 100;

  // Calculate returns
  const totalReturn24h = dailyReturn * 1;
  const totalReturn30d = dailyReturn * 30;
  const totalReturnPlan = dailyReturn * plan.duration;

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
    durationDays: plan.duration,
    returnPercentage: plan.dailyProfit,
    minAmount: plan.minAmount,
    maxAmount: plan.maxAmount,
    totalReturnPercentage: plan.totalReturn,
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
      minAmount: calc.minAmount,
      maxAmount: calc.maxAmount,
      totalReturnPercentage: calc.totalReturnPercentage,
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
            minAmount: response.recommendedPlan.minAmount,
            maxAmount: response.recommendedPlan.maxAmount,
            totalReturnPercentage:
              response.recommendedPlan.totalReturnPercentage,
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
