# Axix Finance Platform

Full-stack investment tracking and automated daily returns platform.

## Stack

- Backend: Node.js / Express, Supabase (Postgres)
- Frontend: React (Vite)
- Scheduler: Fly.io Machine (cron) for daily investment processor
- Integrity: Hash-chained financial ledger + job run tracking table

## Key Features

- Automated daily investment returns with completion payout model (post cutoff date)
- AdminV2 dashboard: audit logs, financial ledger, job runs, daily returns KPIs
- Investment lifecycle tracking: active + completed investments history
- Tamper-evident ledger verification endpoint

## Getting Started

```bash
npm install
npm run build
npm start   # or node dist/server/index.cjs
```

Visit client at the same origin (SPA served from Express). Dev scripts may differ if running Vite separately.

## Required Environment Variables

(Values injected via secret manager – do NOT commit real values.)

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- SUPABASE_ANON_KEY
- JWT_SECRET
- SESSION_SECRET
- RESEND_API_KEY (email)
- ADMIN_PASSWORD (for initial admin auth flow)
- FRONTEND_URL / SITE_URL (links in emails)

See `.env.example` for placeholders. Real secrets must be set using `fly secrets set` (production) or locally in untracked `.env.local`.

## Secret Hygiene

Custom scanner blocks merges if high/critical findings are detected.

```bash
npm run secret:scan
```

CI workflow: `.github/workflows/secret-scan.yml`.
Rotation & purge procedures: `docs/SECRET_HYGIENE.md` + `docs/CREDENTIAL_ROTATION_CHECKLIST.md`.

## Automated Daily Returns Cron Worker (Fly.io)

Daily returns are processed by a dedicated cron worker process on Fly.io. No manual admin trigger is required.

### Process Groups

The Fly.io deployment defines two process groups in `fly.toml`:

```toml
[processes]
app = "node dist/server/index.cjs"
cron = "node dist/server/cron-jobs.cjs"
```

### Scaling the Cron Worker

After deployment, scale the cron worker to 1:

```bash
fly scale count 1 -a <app-name> --process-group cron
```

Check status:

```bash
fly status -a <app-name>
```

Both `app` and `cron` should be listed.

### Logs & Verification

Check logs for cron worker activity:

```bash
fly logs -a <app-name> --process-group cron
```

Look for:

- `🚀 Cron worker started`
- `⏰ Daily returns job executed at <timestamp>`

### No Manual Trigger

Manual admin panel buttons for running daily returns have been removed. The job runs automatically via the cron worker.

### Error Handling

All job logic is wrapped in try/catch and errors are logged for visibility.

### For more details

See `FINAL_AUDIT_REPORT.md` for operational playbook and validation steps.

## Financial Ledger

- Append-only, hash chained
- Verify: `GET /api/admin/ledger/verify` (supports sampling)
- Admin list: `GET /api/admin/ledger` with filters (userId, entryType, referenceTable, referenceId)

## Job Runs

- Table: `job_runs`
- List: `GET /api/admin/job-runs` (filters: jobName, success)

## Development Notes

- Limit parameters clamped at 200 server-side
- All admin endpoints enforce role === 'admin'
- Use UTC date boundaries for returns logic

## OpenAPI & Types

- Spec: `docs/openapi.yaml`
- Regenerate types: `npm run spec:types` (outputs `shared/api-types.ts`)

## Testing

```bash
npm test
```

Vitest config in `vitest.config.ts`. Some legacy investment tests may be pending stabilization.

## Security Posture Summary

- Removed hard-coded secret fallbacks
- Sanitized committed env files (placeholders only)
- Secret scan CI gating
- Pending: external credential rotation + git history purge if not yet completed

## Contributing

1. Create feature branch
2. Run `npm run secret:scan` and tests before PR
3. Ensure OpenAPI changes regenerate types

## License

Proprietary (update if an OSS license is chosen later).

## Investment Earnings Integrity & Audit

To mitigate historical risk of double-crediting investment earnings at completion, the completion helper now only returns principal. Earnings for completion-only policy investments (plans starting on or after 2025-09-18 UTC) are credited exactly once in the completion branch; earlier investments continue daily crediting only (no final bulk earnings credit). This separation prevents duplicated earnings in user balances.

Run an on-demand audit to detect discrepancies:

```bash
node scripts/audit-investment-returns.mjs
```

Output is JSON lines with events:

- `discrepancy_active` – active investment where `days_elapsed * dailyAmount != total_earned`
- `discrepancy_completed` – completed snapshot where `duration * dailyAmount != total_earned`
- `summary` – counts of discrepancies

If discrepancies surface, investigate specific investment IDs and reconcile via controlled SQL updates or ledger adjustments. Always capture before/after snapshots.
