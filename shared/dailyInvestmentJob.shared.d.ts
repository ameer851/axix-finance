export interface DailyInvestmentJobMetrics {
  processed: number;
  completed: number;
  totalApplied: number;
  [k: string]: any;
}
export interface RunDailyInvestmentJobOptions {
  supabaseUrl: string;
  serviceRoleKey: string;
  dryRun?: boolean;
  source?: string;
  sendIncrementEmails?: boolean;
  sendCompletionEmails?: boolean;
  forceCreditOnCompletionOnly?: boolean;
}
export declare function runDailyInvestmentJob(
  opts: RunDailyInvestmentJobOptions
): Promise<DailyInvestmentJobMetrics>;
