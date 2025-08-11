# Developer Notes

Current date: 2025-08-10

## Temporary Stubs

- server/storage/admin-storage.ts – fully stubbed while DB layer is in flux.
- server/fixed-admin-panel.ts, server/fixed-storage-helpers.ts – legacy / superseded by modular admin-api; retained for reference only.

## React Query Keys

Centralized in client/src/lib/queryKeys.ts. Prefer using these helpers instead of ad-hoc string paths.

## Pending Cleanup

1. Replace admin storage stub with real implementation (Supabase or Drizzle reintroduction).
2. Remove remaining `as any` casts (search repo for `as any`).
3. Prune deprecated legacy admin panel files after confirming no runtime dependency.
4. Revisit notification websocket once notification feature returns to scope.
5. Replace broad `amount as string` casts: strengthen `Transaction.amount` typing (consider normalizing to string at boundary or adding a helper for numeric conversion).
6. Consolidate date parsing via `client/src/lib/date.ts` (new) instead of ad-hoc `new Date(...)` scattered logic.

## Centralized Date Handling (NEW)

Added `client/src/lib/date.ts` providing:

- `parseDate(input)` -> Date | null (accepts Date | string | number | null)
- `formatDateSafe(input, opts?, locale?)` -> localized date or 'Invalid Date'
- `toIso(input)` -> ISO string or null

Adoption plan:

1. Gradually replace inline `new Date(value)` with `parseDate(value)` checks.
2. Use `formatDateSafe` where simple human-readable date needed; keep existing `formatDate` util for legacy formatting until unified.
3. After migration, remove duplicated normalization snippets in Transactions, Wallets, histories.

## Storage Stub Summary

`DatabaseStorage` (admin) & `FixedStorageHelpers` are inert placeholders returning safe defaults. They deliberately avoid touching the real DB layer while Supabase integration stabilizes. When re-implementing:

- Define an interface `IAdminStorage` enumerating required methods.
- Provide `SupabaseAdminStorage` implementing it; inject where needed (constructor or simple factory) to reduce future swapping friction.

## Next Implementation TODOs

- [ ] Define `IAdminStorage` interface and refactor stubs to implement it.
- [ ] Improve `Transaction` typing consumption: remove casts for `amount` by creating helpers `getNumericAmount(tx)`.
- [ ] Replace repetitive date formatting with new helpers (search `new Date(`).
- [ ] Add minimal vitest tests for `parseDate` edge cases (invalid strings, timestamps, empty).
- [ ] Document expected shapes for `updateUser` subset merges.

---

Last updated: 2025-08-10

## Testing Suggestion

Add API smoke tests for critical auth & admin endpoints once storage is restored.

## Migration Strategy

Short term: keep stubs to protect type safety.
Medium term: implement repository interfaces and inject concrete storage for easier swapping.
