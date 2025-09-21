# Daily Investment Job Operations Guide

This document describes how the `daily-investments` job is scheduled, monitored, and manually managed in production.

## Overview

The daily job applies returns to active investments and completes matured investments. Logic is centralized in:

`shared/dailyInvestmentJob.shared.js` (export: `runDailyInvestmentJob`)

Execution paths:

1. Scheduled Fly.io Machine (primary daily run)
2. Admin manual trigger `POST /api/admin/investments/run-daily` (with optional `?dryRun=1`)
3. Direct script invocation: `npm run cron:run` (calls `scripts/auto-investment-processor.js` which delegates to shared module)

Observability:

- `job_runs` table persists each run (one per UTC day enforced via constraint)
- Admin status endpoint: `GET /api/admin/jobs/daily-investments/status` (stale if >26h since last `started_at`)
- Admin runs listing: `GET /api/admin/jobs/daily-investments/runs?page=1&limit=20`
- Structured JSON logs (lines with `job: "daily-investments"`) emitted to stdout for log aggregation

## Database Schema

Migration: `migrations/20250919_add_job_runs_table.sql`

Columns (subset):

- `job_name` (text) — always `daily-investments`
- `started_at`, `finished_at`
- `processed_count`, `completed_count`, `total_applied`
- `success` (nullable boolean)
- `error_text` (nullable)
- `source` (cron | manual | api)
- `meta` (JSONB; includes `{ dryRun: true }` for dry runs)

Uniqueness: one row per `(job_name, started_at::date)` for idempotence per UTC day.

## Scheduling on Fly.io

We use a dedicated **scheduled Machine** running the same image as the main app but executing the cron script entrypoint once per day.

### 1. Build & Push Image

```bash
fly deploy --build-only --image-label daily-job-base
fly image show   # note digest
```

### 2. Launch / Update Scheduled Machine

Use a cron schedule (example: 00:05 UTC daily). Replace `<DIGEST>` with the built image digest.

```bash
fly machine update <MACHINE_ID> \
  --image registry.fly.io/<APP_NAME>@<DIGEST> \
  --schedule "0 5 * * *" \
  --command "node" \
  --entrypoint "node" \
  -- "scripts/auto-investment-processor.js"
```

If creating new:

```bash
fly machine run registry.fly.io/<APP_NAME>@<DIGEST> \
  --schedule "0 5 * * *" \
  --region <REGION> \
  --command "node" \
  --entrypoint "node" \
  -- "scripts/auto-investment-processor.js"
```

Notes:

- Schedule uses **UTC**. Adjust minute offset if you prefer a buffer after midnight.
- Machine should include required secrets (inherit from app or set individually): `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, mail settings.

### 3. Secrets

Ensure secrets are present (service role key required):

```bash
fly secrets set SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... EMAIL_FROM=... --app <APP_NAME>
```

If the scheduled machine is part of the same app, it inherits secrets automatically.

## Verification Checklist After Deployment

1. Run manually (dry run) to confirm no errors:  
   `curl -X POST -H "Authorization: Bearer <ADMIN_TOKEN>" https://<DOMAIN>/api/admin/investments/run-daily?dryRun=1`
2. Execute a live run if within safe window: omit `dryRun`.
3. Query status endpoint; ensure `stale: false` after run.
4. Inspect `job_runs` table row: processed/completed counts reasonable; `success = true`.
5. Review structured logs for anomalies (`investment_exception`, `unlock_exception`).

## Health Check Automation

A helper script (to be added): `scripts/check-daily-job-status.mjs` will:

- Call `/api/admin/jobs/daily-investments/status`
- Exit with code 1 if stale
  This can be integrated into external monitoring (e.g., GitHub Actions, UptimeRobot webhook, Fly checks).

Example (pseudo):

```bash
node scripts/check-daily-job-status.mjs
```

## Manual Recovery

If the scheduled run missed a day:

1. Trigger manual run (live) once — do **not** re-run if `job_runs` already has a row for that UTC date.
2. If row missing and schedule misconfigured, manually run `npm run cron:run` on a console machine.
3. Recreate / update scheduled machine with correct cron spec.

## Log Filtering

Structured log lines contain JSON with `job: "daily-investments"`. Examples:

- `{"ts":"...","job":"daily-investments","event":"start",...}`
- `{"event":"summary","processed":3,"completed":1,...}`

Filter suggestion:

```bash
fly logs | grep '"job":"daily-investments"'
```

## Fields & Events

Primary events emitted:

- `start` — job invocation
- `found_investments` — count of candidates
- `consider` — per-investment processing attempt
- `investment_exception` — per-investment error
- `unlock_exception` / `archive_exception` — completion steps
- `summary` — aggregate metrics
- `finalize_exception` — failure updating `job_runs`

## Updating Logic Safely

1. Modify shared module `shared/dailyInvestmentJob.shared.js`.
2. Run local dry run: `npm run cron:dry-run`.
3. Deploy image and run admin dry run in production.
4. Confirm metrics & no errors.
5. Allow schedule to execute normally next UTC day.

## Rollback Plan

If a change causes errors:

- Re-deploy previous image digest to scheduled machine.
- (Optional) Temporarily disable schedule while investigating: `fly machine update <ID> --schedule ""`.

## Future Enhancements (Optional)

- Add metric export endpoint for dashboards.
- Add per-investment diff preview for dry runs.
- Emit Prometheus-style counters.

---

Document version: 2025-09-19
