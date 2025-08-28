import { INVESTMENT_PLANS } from "../../server/investmentService";
import { financialAPI } from "./api";

export interface AutoInvestmentPlan {
  id: string;
  name: string;
  minAmount: number;
  maxAmount: number | null;
  dailyProfit: number;
  duration: number;
  totalReturn: number;
}

export interface AutoInvestmentDeposit {
  amount: number;
  planName: string;
  transactionHash?: string;
  method?: string;
}

export interface AutoInvestmentResult {
  success: boolean;
  transaction?: any;
  plan?: AutoInvestmentPlan;
  dailyReturn?: number;
  totalReturn?: number;
  investmentPeriod?: number;
  message?: string;
}

/**
 * Automatic Investment Service
 * Handles instant investment deposits without admin approval
 */
export class AutoInvestmentService {
  /**
   * Get all available investment plans
   */
  static getInvestmentPlans(): AutoInvestmentPlan[] {
    return INVESTMENT_PLANS;
  }

  /**
   * Validate investment deposit data
   */
  static validateDeposit(data: AutoInvestmentDeposit): {
    isValid: boolean;
    error?: string;
  } {
    const { amount, planName } = data;

    if (!amount || amount <= 0) {
      return { isValid: false, error: "Invalid amount" };
    }

    if (!planName) {
      return { isValid: false, error: "Investment plan is required" };
    }

    const plan = INVESTMENT_PLANS.find((p) => p.name === planName);
    if (!plan) {
      return { isValid: false, error: "Invalid investment plan" };
    }

    if (
      amount < plan.minAmount ||
      (plan.maxAmount && amount > plan.maxAmount)
    ) {
      return {
        isValid: false,
        error: `Amount must be between $${plan.minAmount} and $${plan.maxAmount || "unlimited"} for ${planName}`,
      };
    }

    return { isValid: true };
  }

  /**
   * Calculate investment returns for a given amount and plan
   */
  static calculateReturns(
    amount: number,
    planName: string
  ): {
    dailyReturn: number;
    totalReturn: number;
    plan: AutoInvestmentPlan | null;
  } {
    const plan = INVESTMENT_PLANS.find((p) => p.name === planName);

    if (!plan) {
      return { dailyReturn: 0, totalReturn: 0, plan: null };
    }

    const dailyReturn = (amount * plan.dailyProfit) / 100;
    const totalReturn = (amount * plan.totalReturn) / 100;

    return { dailyReturn, totalReturn, plan };
  }

  /**
   * Create an automatic investment deposit
   * This instantly credits the user's balance and creates an investment
   */
  static async createInvestmentDeposit(
    data: AutoInvestmentDeposit
  ): Promise<AutoInvestmentResult> {
    try {
      // Validate the deposit data
      const validation = this.validateDeposit(data);
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error,
        };
      }

      // Create the investment deposit
      const response = await financialAPI.createInvestmentDeposit(data);

      if (response.success) {
        const {
          transaction,
          plan,
          dailyReturn,
          totalReturn,
          investmentPeriod,
        } = response.data;

        return {
          success: true,
          transaction,
          plan,
          dailyReturn,
          totalReturn,
          investmentPeriod,
          message: "Investment deposit completed successfully",
        };
      } else {
        return {
          success: false,
          message: response.message || "Failed to create investment deposit",
        };
      }
    } catch (error: any) {
      console.error("Auto investment deposit error:", error);
      return {
        success: false,
        message: error.message || "Failed to process investment deposit",
      };
    }
  }

  /**
   * Get investment statistics for a user
   */
  static async getInvestmentStats(userId: number): Promise<{
    totalInvested: number;
    totalEarned: number;
    activeInvestments: number;
    completedInvestments: number;
  }> {
    try {
      // This would typically fetch from the investment service
      // For now, return placeholder data
      return {
        totalInvested: 0,
        totalEarned: 0,
        activeInvestments: 0,
        completedInvestments: 0,
      };
    } catch (error) {
      console.error("Error fetching investment stats:", error);
      return {
        totalInvested: 0,
        totalEarned: 0,
        activeInvestments: 0,
        completedInvestments: 0,
      };
    }
  }

  /**
   * Format currency values for display
   */
  static formatCurrency(amount: number): string {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
    }).format(amount);
  }

  /**
   * Calculate progress percentage for an investment
   */
  static calculateProgress(daysElapsed: number, totalDays: number): number {
    if (totalDays <= 0) return 100;
    return Math.min((daysElapsed / totalDays) * 100, 100);
  }

  /**
   * Get plan by name
   */
  static getPlanByName(planName: string): AutoInvestmentPlan | null {
    return INVESTMENT_PLANS.find((p) => p.name === planName) || null;
  }

  /**
   * Get recommended plan for amount
   */
  static getRecommendedPlan(amount: number): AutoInvestmentPlan | null {
    const suitablePlans = INVESTMENT_PLANS.filter(
      (plan) =>
        amount >= plan.minAmount &&
        (!plan.maxAmount || amount <= plan.maxAmount)
    );

    // Return the plan with highest returns
    return (
      suitablePlans.sort((a, b) => b.totalReturn - a.totalReturn)[0] || null
    );
  }
}
