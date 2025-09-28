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
  sendEmail?: (args: {
    to: string;
    subject: string;
    html: string;
    headers?: Record<string, string>;
  }) => Promise<boolean>;
  sendIncrementEmails?: boolean;
  sendCompletionEmails?: boolean;
  forceCreditOnCompletionOnly?: boolean;
}
export declare function runDailyInvestmentJob(
  opts: RunDailyInvestmentJobOptions
): Promise<DailyInvestmentJobMetrics>;
