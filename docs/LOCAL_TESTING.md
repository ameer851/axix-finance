# Local Testing: User + Investment Lifecycle

This guide shows how to test a single user's investment lifecycle locally without deploying.

Prerequisites:

- .env at repo root with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY
- Node 20+ on Windows, PowerShell v5+

Quick steps (PowerShell):

1. Verify DB setup and credentials

- Run: node scripts/verify-database-setup.js

2. Create a test investment for an existing user and set first profit to today (UTC SOD)

- Run: node scripts/create-test-investment.mjs --user-email `you@example.com` --amount 500 --duration 3 --daily 2 --total 106 --first-today
- Alternatives: --user `UUID` or --user-id `INT`

3. Apply daily returns using server logic (no HTTP/auth needed)

- Run: npx tsx scripts/apply-returns-runner.ts

4. Inspect state

- Run: node scripts/check-investments.js

All-in-one (recommended):

- Run (PowerShell direct): scripts/local-e2e-investment-test.ps1 -UserEmail `you@example.com` -Amount 500 -Duration 3 -DailyPct 2
- Or (explicit PowerShell invocation):
  - powershell -NoProfile -ExecutionPolicy Bypass -File "scripts/local-e2e-investment-test.ps1" -UserId 24 -Amount 500 -Duration 3 -DailyPct 2

Notes:

- For a true "next day" test, either wait until next UTC SOD or adjust first_profit_date forward and rerun.
- Emails are best-effort via SMTP if configured; otherwise they're skipped.
- The apply-returns-runner directly calls server/investmentService.applyDailyReturns().

Client dashboard additions:

- New tabs/pages inside the dashboard:
  - Investment Calculator: /investment-calculator
  - Investment History (completed): /investment-history and /client/investment-history
  - Track Investment (by ID): /track-investment and /client/track-investment
  - Investments overview with tabs (Active/History): /investments and /client/investments

These routes are protected and require a logged-in, verified user.

## 2025-09-16 Enhancements

- Investment History table now includes an ID column.
- Added a filter input on the History tab (filters by ID and Plan name) with simple pagination (10 rows per page).
- Added an Actions column to investments tables with a deep-link “View in tracker” that opens `/track-investment?id=<id>`.
- Track Investment page shows clearer loading, empty, and not-found states.

### Smoke test: client routes

Run a quick smoke test for key client routes after building or when running dev server:

```bash
node scripts/smoke-client-routes.mjs http://localhost:5173
```

If BASE_URL is omitted, it defaults to <http://localhost:5173> or the BASE_URL env var.
