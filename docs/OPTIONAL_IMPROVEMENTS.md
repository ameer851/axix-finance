# Optional Improvements & Backlog Candidates

## Security & Compliance

- Add SARIF output to secret scanner for GitHub Code Scanning integration.
- Integrate gitleaks or TruffleHog as secondary scanning stage.
- Automated periodic (weekly) ledger sample verification job with alerting.
- Implement alert pipeline (GitHub Action + Slack/Webhook) for stale daily job (>26h) or ledger hash mismatch.
- Add structured security.txt endpoint or public security policy doc.

## Secret Scanner Enhancements

- Patterns: Stripe (sk*live*), Slack (xoxb-), GitHub PAT (ghp\_), OpenAI (sk-), Cloudflare (CF_API_TOKEN), Google API (AIza...).
- Optional entropy whitelist for package-lock `integrity` fields to suppress info noise.
- Parallelize scanning with worker_threads if repo grows.

## Testing & Quality

- Add comprehensive filter combination tests for /api/admin/ledger and /api/admin/job-runs.
- Add corruption simulation test that injects a bad previous_hash mid-chain and ensures verify endpoint flags it (if not already covered).
- Snapshot OpenAPI spec diff in CI to catch unintended breaking changes.

## Observability

- Add Prometheus-style metrics endpoint (auth-protected) for job run and ledger counts.
- Structured JSON logging for admin actions (consistent field set: ts, level, event, userId, meta).

## Performance

- Pagination keyset optimization for ledger (id < lastId) to avoid large OFFSET scans at scale.
- Optional materialized view for daily earnings aggregates.

## UX / Admin

- Admin UI widget: last daily job run summary + manual trigger button with dry-run toggle.
- Ledger detail modal: show computed hash chain context (previous_hash, entry_hash) for selected row.

## Data Integrity

- Background scheduled sampled verification (e.g., verify 1% of ledger daily) storing results in `job_runs`.
- Chain anchor hashing: publish daily root hash to external append-only medium (future tamper evidence).

## Documentation

- Architecture diagram (mermaid) showing request flow, job processor, ledger hashing.
- Formal threat model doc (STRIDE-focused) for investment and ledger system.

## Cleanup / Deferred Items

- Resolve legacy failing investmentService tests flagged during ledger/job runs implementation.
- Migrate any remaining snake_case/camelCase hybrid fields to unified mapping layer.

---

Add new ideas here with rationale and rough impact/effort if prioritization needed.
