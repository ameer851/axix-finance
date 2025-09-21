# Latest Update Notes (2025-09-20)

## Summary

This release wave introduces capability-aware environment validation, immutable financial ledgering, transactional investment completion (when direct DB is available), cron idempotency safeguards, and improved operational transparency.

## Deltas Since Last Stable Snapshot

- Added `financial_ledger` table + service for append-only hash-chained balance & active deposit adjustments.
- Injected ledger recording into all balance / active deposit mutation paths and investment completion payout.
- Introduced conditional transactional investment completion using direct Postgres connection string (`SUPABASE_DB_URL` / `DATABASE_URL`).
- Added `job_runs` table for daily returns execution ledger; enforced uniqueness per UTC day for idempotence.
- Refactored daily returns logic into shared runner with structured JSON logs.
- Added admin endpoints for: manual daily run trigger, status inspection, historical run pagination.
- Post-cutoff policy enforcement: daily earnings no longer credited to available balance for new investments; credited only once on completion.
- Extended environment validation with capability flags (`hasServiceRole`, `canDirectDb`, `transactionalCompletions`).
- Added `server/capabilities.ts` for lazy capability retrieval.
- Added async route wrapper and applied to withdrawal flow; expanded structured logging for withdrawal lifecycle.
- Added `schema-diff` script to detect schema drift in CI.
- Added Vitest test harness + initial investment service tests.
- Auth & operational logs enriched (correlation fields; granular job logging events).

## New Environment Variables

| Variable                          | Purpose                                                                           | Production Requirement |
| --------------------------------- | --------------------------------------------------------------------------------- | ---------------------- |
| SUPABASE_SERVICE_ROLE_KEY         | Privileged Supabase operations (admin, archival, manual cron triggers)            | Required               |
| SUPABASE_DB_URL (or DATABASE_URL) | Direct Postgres connection for transactional operations & ledger integrity checks | Strongly Recommended   |

## Capability Flags (Derived)

| Flag                     | Enabled When                            | Effect                                                      |
| ------------------------ | --------------------------------------- | ----------------------------------------------------------- |
| hasServiceRole           | SUPABASE_SERVICE_ROLE_KEY set           | Admin & privileged writes allowed                           |
| canDirectDb              | SUPABASE_DB_URL or DATABASE_URL present | Direct pg transactions & potential row-level locking        |
| transactionalCompletions | canDirectDb true                        | Investment completion executed atomically in DB transaction |

## Operational Changes

- Daily returns run now early-exits if a `job_runs` entry exists for the current UTC date (idempotency).
- Manual trigger respects same guards; dryRun mode supported for diagnostics.
- Balance endpoints expose `adjustedAvailable` factoring out uncredited post-cutoff earnings.

## Testing & Validation

- Added unit tests for investment creation (bounds, duplicate prevention, success path) with in-memory Supabase mock.
- Future tests planned: ledger entry assertions, cron idempotency skip, transactional completion path.

## Migration Checklist

1. Apply new migrations (ledger + job_runs + completed_investments if not already applied).
2. Set `SUPABASE_SERVICE_ROLE_KEY` secret in production environment.
3. Provide `SUPABASE_DB_URL` (or `DATABASE_URL`) to enable transactional mode.
4. Recreate scheduled Machine / cron to ensure latest image & job ledger integration.
5. Run `node scripts/schema-diff.mjs` to confirm schema alignment.

## Post-Deploy Verification

- Check startup logs for `ENV validation passed` with capabilities object.
- Trigger manual daily run (`dryRun=1`) and confirm no side effects; then real run if needed.
- Complete a test investment and verify single ledger entry for payout + archival snapshot.
- Query `job_runs` for today's row (success=true).

## Deferred / Next

- Automated ledger chain verification endpoint / periodic check.
- OpenAPI document expansion + generated client.
- Additional test coverage (cron edge, ledger hash integrity, error branches).
- Alerting integration for missed daily job SLA.

---

Prepared for deployment coordination and release documentation.
