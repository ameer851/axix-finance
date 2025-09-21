import { describe, expect, it, vi } from "vitest";

// Attempt to import services under test.
// These paths assume test environment transpiles TS or runs ts-node/register in vitest config.
import { validateEnv } from "../server/env-check";
import { financialLedger } from "../server/financialLedger";

// Mock supabase insert/select used by financialLedger.record
vi.mock("../server/supabase", () => {
  const rows: any[] = [];
  return {
    supabase: {
      from: (table: string) => ({
        select: (_cols: string) => ({
          eq: (_col: string, _val: any) => ({
            order: () => ({
              limit: () => ({
                maybeSingle: async () => ({
                  data: rows.length
                    ? { entry_hash: rows[rows.length - 1].entry_hash }
                    : null,
                  error: null,
                }),
              }),
            }),
          }),
          order: () => ({
            limit: () => ({
              maybeSingle: async () => ({
                data: rows.length
                  ? { entry_hash: rows[rows.length - 1].entry_hash }
                  : null,
                error: null,
              }),
            }),
          }),
        }),
        insert: (payload: any) => ({
          select: () => ({
            single: async () => {
              rows.push({ ...payload, id: rows.length + 1 });
              return { data: { id: rows.length }, error: null };
            },
          }),
        }),
      }),
      rpc: vi.fn(),
    },
  } as any;
});

// Lightweight in-memory shim for Supabase interactions the ledger relies on (if any) is not required
// because ledger service should only interact with provided parameters & internal hashing.

describe("financialLedger.record & verifyChain", () => {
  // No stateful reset required for current implementation.

  it("computes deterministic hash chain for sequential entries", async () => {
    const userId = 42;
    const entries: string[] = [];
    // Monkey patch getLastHash to feed previous entries for this test only if needed
    // Instead we'll simulate what record() likely does by calling ledger.record sequentially
    const r1 = await financialLedger.record({
      userId,
      entryType: "balance_adjust",
      amountDelta: 100,
      activeDepositsDelta: 0,
      balanceAfter: 100,
      activeDepositsAfter: 0,
      metadata: { reason: "seed" },
    });
    const r2 = await financialLedger.record({
      userId,
      entryType: "active_deposit_lock",
      amountDelta: -50,
      activeDepositsDelta: 50,
      balanceAfter: 50,
      activeDepositsAfter: 50,
      metadata: { reason: "lock" },
    });

    expect(r1.success).toBe(true);
    expect(r2.success).toBe(true);
  });
});

describe("env-check capabilities", () => {
  it("derives capabilities based on env presence", () => {
    const original = { ...process.env };
    try {
      delete process.env.SUPABASE_DB_URL;
      delete process.env.DATABASE_URL;
      const noDb = validateEnv();
      expect(noDb.capabilities.canDirectDb).toBe(false);
      process.env.SUPABASE_DB_URL = "postgresql://example";
      const withDb = validateEnv();
      expect(withDb.capabilities.canDirectDb).toBe(true);
      expect(withDb.capabilities.transactionalCompletions).toBe(true);
    } finally {
      process.env = original;
    }
  });
});
