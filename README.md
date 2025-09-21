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

## Daily Investment Job

Shared logic: `shared/dailyInvestmentJob.shared.js`

- Manual trigger: `POST /api/admin/investments/run-daily?dryRun=1`
- Status: `/api/admin/jobs/daily-investments/status`
- Health: `/api/admin/jobs/daily-investments/health`

Cron (Fly example):

```bash
fly machine run <image> --schedule "0 5 * * *" -a axix-finance --region iad --command "node /app/scripts/auto-investment-processor.js"
```

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
