# Investment System Fix Guide

## Issue Identified

- Locked investments not increasing as expected
- Active investments component showing count instead of monetary value
- Cron job is set up but no active investments found in database

## Fix Steps

### 1. Create Test Investment

First, create a test investment to verify the system works correctly:

```javascript
// Create an investment record with first_profit_date (UTC start-of-day)
const now = new Date();
const tomorrow = new Date(
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

const { data: investment, error: invError } = await supabase
  .from("investments")
  .insert({
    user_id: USER_ID_HERE, // Replace with actual user ID
    transaction_id: TRANSACTION_ID_HERE, // Replace or create a transaction first
    plan_name: "STARTER PLAN",
    plan_duration: 3,
    daily_profit: 2,
    total_return: 106,
    principal_amount: 500, // Amount to invest
    start_date: new Date().toISOString(),
    end_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: "active",
    days_elapsed: 0,
    total_earned: 0,
    first_profit_date: tomorrow.toISOString(), // Set first profit date
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  })
  .select()
  .single();
```

Alternatively, use the provided CLI helpers (Windows PowerShell examples):

- List users to get UUID and integer id pairs:

  PowerShell
  node scripts/list-users.mjs

- Create a test investment for a specific user id, auto-creating a seed transaction, and set first profit date to today (UTC SOD) for immediate testing:

  PowerShell
  node scripts/create-test-investment.mjs --user-id 18 --amount 500 --plan "STARTER PLAN" --duration 3 --daily 2 --total 106 --first-today

Notes:

- investments.user_id expects the integer users.id; transactions.user_id expects users.uid (UUID). The helper script resolves both correctly.
- Add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env in repo root for local script runs.

### 2. Verify Investment Creation

Use the diagnostic script to verify the investment was created:

```bash
node scripts/check-investments.js
```

### 3. Run Processor Manually

Test the investment processor manually:

```bash
node scripts/auto-investment-processor.js
```

Use dry-run first to validate selection without writing:

PowerShell
node scripts/auto-investment-processor.js --dry-run

### 4. Check Cron Job Status and Logs

Verify the cron job is running correctly:

```bash
fly machines list --app axix-finance
```

Check logs from the cron job:

```bash
fly logs -a axix-finance --instance daily-investment-returns
```

Windows helper scripts to set up a scheduled machine at 02:00 UTC:

PowerShell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-fly-cron-fixed.ps1

If you encounter PowerShell parse errors, open the file and ensure the braces are balanced and your shell encoding is UTF-8 without BOM.

### 5. Update First Profit Date

If needed, update the first_profit_date for existing investments:

```sql
-- Run this in Supabase SQL Editor
UPDATE investments
SET first_profit_date = CURRENT_DATE
WHERE status = 'active' AND first_profit_date IS NULL;
```

### 6. Restart Cron Job

If necessary, recreate the cron job:

```bash
# Remove existing cron job
fly machines destroy daily-investment-returns --app axix-finance

# Create new cron job
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/setup-fly-cron-fixed.ps1
```

### 7. Verify Results

After applying fixes, check that:

- Investments show in the diagnostic script
- Auto-investment processor runs successfully
- User balance increases after profits are applied

## Common Issues

1. **No active investments**: Create test investments or use the UI to create real investments
2. **First profit date not set**: Update database to set first_profit_date
3. **Cron job not running**: Check Fly.io logs and recreate if needed
4. **Module errors**: Ensure scripts are using the correct module format (ESM vs CommonJS)
5. **Active investments display showing count instead of value**: Check `InvestmentDashboard.tsx` implementation

6. PowerShell script parse error: Unexpected token '}' → Ensure your script files (`scripts/setup-fly-cron-*.ps1`) have matching braces and correct newlines; re-save as UTF-8 and rerun with `-ExecutionPolicy Bypass`.

## Active Investments Display Fix

The InvestmentDashboard component was updated to display both the monetary value and count of active investments:

```tsx
// Previous implementation - only showed count
<CardContent>
  <div className="text-2xl font-bold">{activeInvestments.length}</div>
</CardContent>

// New implementation - shows monetary value and count
<CardContent>
  <div className="text-2xl font-bold">{formatCurrency(activeInvestmentsValue)}</div>
  <p className="text-xs text-muted-foreground mt-1">
    {activeInvestments.length} active {activeInvestments.length === 1 ? 'plan' : 'plans'}
  </p>
</CardContent>
```

This change ensures users can see both how many active investment plans they have and the total value invested in those plans.

## Understanding Active Deposits vs Active Investments

There are two related but distinct metrics in the system:

1. **Active Deposits**: Funds that are currently locked in active investments (tracked in the user table)
2. **Active Investments**: The current value of investments that are in "active" status (calculated from the investments table)

Ideally, these two values should match or be very close. If they differ significantly, it may indicate an issue with how investment funds are being tracked.

## Long-term Monitoring

1. Set up daily monitoring to verify profit application
2. Add logging for cron job execution
3. Create admin dashboard to view investment status

## Verification Log (2025-09-15)

- Seeded investment for user id 18 with first_profit_date = 2025-09-15T00:00:00Z using `create-test-investment.mjs` (auto-created transaction id 92).
- Ran diagnostics: `check-investments.js` reported 1 active investment; eligible for daily return today.
- Ran processor dry-run and live: Applied $2.00 (Day 1/3). Diagnostics showed `days_elapsed = 1`, `total_earned = 2`, `last_return_applied = 2025-09-15` and one record in `investment_returns`.
- Action items: Ensure Fly scheduled machine exists for 02:00 UTC; use `setup-fly-cron-fixed.ps1` and validate with `fly machines list` and `fly logs`.

## Email Notifications (New)

Two transactional emails are now sent when processing returns, using fully branded templates across both server and cron paths:

- Daily Increment: dispatched after each successful daily return. Includes plan name, day progress, today's return, and total earned, with a dashboard link.
- Plan Completed: dispatched when an investment is completed. Includes plan name, duration, principal, total earned, total payout, and a dashboard link.

Implementation:

- Server path: `server/investmentService.ts` triggers `sendInvestmentIncrementEmail` and `sendInvestmentCompletedEmail` from `server/emailService.ts`, rendering templates in `server/emailTemplates.ts`.
- Cron path: `scripts/auto-investment-processor.js` imports branded templates/subjects from `shared/emailTemplates.shared.js` and sends branded emails via SMTP (Resend SMTP supported). Custom headers include `X-Axix-Mail-Event` identifying the event (increment/completed).
- Webhooks: POST `/api/email/webhooks/resend` accepts Resend webhook payloads and records them to `audit_logs` with action `resend_webhook`. This enables automated assertions without needing a Resend events API.

Environment:

- Use RESEND_API_KEY + EMAIL_FROM for Resend SMTP or SMTP_HOST/SMTP_USER/SMTP_PASSWORD/SMTP_PORT for your SMTP server.
- FRONTEND_URL or PRODUCTION_URL used for dashboard links; WEBSITE_NAME/FAVICON_URL/WELCOME_IMAGE_URL optionally override branding in shared templates.
- SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required for scripts.

Automated E2E Test:

- Script: `scripts/test-investment-emails.mjs`
- What it does: seeds a minimal investment for the target user (first_profit_date = today UTC SOD), runs the processor live, then polls `audit_logs` for webhook entries that include the expected subjects and recipient address.
- Usage (PowerShell):

  PowerShell
  node scripts/test-investment-emails.mjs --user-email you@example.com --plan "STARTER PLAN" --duration 1 --daily 2 --amount 100

- Prerequisites: configure a Resend webhook in the dashboard to POST to `/api/email/webhooks/resend` on your deployed server; ensure EMAIL_FROM and SMTP/RESEND credentials are set so actual mail is sent.
