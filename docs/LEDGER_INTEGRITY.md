# Ledger Integrity & Verification

## Overview

The `financial_ledger` table implements an append-only, hash-chained journal of balance-impacting events. Each row stores:

- `previous_hash` – SHA-256 hash of the immediately preceding logical entry (or null for first)
- `entry_hash` – SHA-256 hash of deterministic concatenation of critical financial fields
- Deltas + resulting post-state (`amount_delta`, `active_deposits_delta`, `balance_after`, `active_deposits_after`)
- Optional linkage (`reference_table`, `reference_id`, `metadata`)

This forms a tamper-evident structure: any mutation, insertion, or deletion in the middle of the chain will break continuity.

## Hash Construction

```
sha256([
  previous_hash,
  user_id,
  entry_type,
  amount_delta,
  active_deposits_delta,
  balance_after,
  active_deposits_after,
  reference_table,
  reference_id,
  JSON.stringify(metadata),
  created_at
].join(':'))
```

## Recording Flow

1. Read last hash for user (O(1) ordered by id desc limit 1).
2. Build deterministic payload and compute `entry_hash`.
3. Insert new row with stored `previous_hash` + `entry_hash`.
4. Structured log event `ledger.record` with minimal context.

Failures are logged as `ledger.record.fail` or `ledger.record.exception`.

## Verification Modes

The service exposes `verifyLedger({ fromId?, toId?, sample? })` which:

- Fetches candidate rows (full range or fallback limited sample)
- Optionally strides sample for large chains
- Recomputes sequential continuity & per-row hash
- Returns `{ ok, checked, firstCorruptionId, hashMismatches, durationMs }`

Admin API: `GET /api/admin/ledger/verify` supports query params:

- `fromId`, `toId` (numeric range)
- `sample` (approximate size to stride through for quick spot-check)

CLI wrapper: `node scripts/verify-ledger.mjs --full` or `--sample 500`.

## Corruption Detection

Detection stops at first mismatch for:

- Broken link: `row.previous_hash !== expectedPrev`
- Content tamper: recomputed hash != stored `entry_hash`

Synthetic tests (`tests/ledgerCorruption.test.ts`) validate both scenarios.

## Operational Recommendations

- Schedule a daily full verification during low traffic hours.
- Run a lightweight sampled verification (e.g., `sample=300`) every 10–30 minutes for early anomaly detection.
- Export daily root hash (last entry_hash of day) to external immutable store (optional compliance).
- Trigger alert if `ok=false` OR if expected growth in entries stalls unexpectedly (indicating ingestion failure).

## Future Hardening Ideas

- Introduce Merkle subtree batching for faster partial verification.
- Add per-row signature (HMAC with rotation) to protect against full-chain rewrite attacks.
- Store daily root hash in a public append-only log (e.g., Git commit, blockchain anchor, notarization service).
- Add user-specific periodic verification endpoint for user-facing audit tools.

## Related Files

- `server/financialLedger.ts`
- `scripts/verify-ledger.mjs`
- `tests/ledgerIntegrity.test.ts`
- `tests/ledgerCorruption.test.ts`
- `docs/openapi.yaml` (LedgerVerifyResult schema)
