# Daily Returns Cron - UTC Behavior

- Selection compares dates at UTC start-of-day to avoid timezone drift.
- Server `applyDailyReturns` uses `first_profit_date <= today` and `last_return_applied < today`.
- Cron script aligns with same logic and logs per-investment date context.

How to run locally (dry-run):

- node scripts/auto-investment-processor.js --dry-run

Notes:

- Ensure SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are set in environment.
- First profit applies when first_profit_date is on or before today (UTC).
