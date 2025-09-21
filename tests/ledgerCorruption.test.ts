import { describe, expect, it } from "vitest";
import { FinancialLedgerService } from "../server/financialLedger";

describe("FinancialLedgerService corruption detection (synthetic)", () => {
  it("detects broken previous_hash chain", () => {
    const svc = new FinancialLedgerService();
    // Build synthetic sequential rows
    const rows: any[] = [];
    let prev: string | null = null;
    for (let i = 1; i <= 5; i++) {
      const payload = {
        userId: 1,
        entryType: "test",
        amountDelta: i,
        activeDepositsDelta: 0,
        balanceAfter: i,
        activeDepositsAfter: 0,
        previousHash: prev || "",
        referenceTable: "",
        referenceId: "",
        metadata: {},
        created_at: new Date(Date.now() + i * 1000).toISOString(),
      };
      const hash = svc.computeHash(payload);
      rows.push({
        id: i,
        user_id: 1,
        entry_type: "test",
        amount_delta: i,
        active_deposits_delta: 0,
        balance_after: i,
        active_deposits_after: 0,
        reference_table: null,
        reference_id: null,
        metadata: {},
        previous_hash: prev,
        entry_hash: hash,
        created_at: payload.created_at,
      });
      prev = hash;
    }
    // Corrupt row 4 previous_hash to simulate tamper
    rows[3].previous_hash = "deadbeef";
    const result = svc._verifyRowsSequential(rows, Date.now());
    expect(result.ok).toBe(false);
    expect(result.firstCorruptionId).toBe(rows[3].id);
  });

  it("detects entry_hash tampering", () => {
    const svc = new FinancialLedgerService();
    const rows: any[] = [];
    let prev: string | null = null;
    for (let i = 1; i <= 5; i++) {
      const payload = {
        userId: 2,
        entryType: "test",
        amountDelta: i,
        activeDepositsDelta: 0,
        balanceAfter: i,
        activeDepositsAfter: 0,
        previousHash: prev || "",
        referenceTable: "",
        referenceId: "",
        metadata: {},
        created_at: new Date(Date.now() + i * 1000).toISOString(),
      };
      const hash = svc.computeHash(payload);
      rows.push({
        id: i,
        user_id: 2,
        entry_type: "test",
        amount_delta: i,
        active_deposits_delta: 0,
        balance_after: i,
        active_deposits_after: 0,
        reference_table: null,
        reference_id: null,
        metadata: {},
        previous_hash: prev,
        entry_hash: hash,
        created_at: payload.created_at,
      });
      prev = hash;
    }
    // Tamper with row 5 hash
    rows[4].entry_hash = "ffffffff";
    const result = svc._verifyRowsSequential(rows, Date.now());
    expect(result.ok).toBe(false);
    expect(result.firstCorruptionId).toBe(rows[4].id);
  });

  it("passes for intact chain", () => {
    const svc = new FinancialLedgerService();
    const rows: any[] = [];
    let prev: string | null = null;
    for (let i = 1; i <= 3; i++) {
      const payload = {
        userId: 3,
        entryType: "ok",
        amountDelta: i,
        activeDepositsDelta: 0,
        balanceAfter: i,
        activeDepositsAfter: 0,
        previousHash: prev || "",
        referenceTable: "",
        referenceId: "",
        metadata: {},
        created_at: new Date(Date.now() + i * 1000).toISOString(),
      };
      const hash = svc.computeHash(payload);
      rows.push({
        id: i,
        user_id: 3,
        entry_type: "ok",
        amount_delta: i,
        active_deposits_delta: 0,
        balance_after: i,
        active_deposits_after: 0,
        reference_table: null,
        reference_id: null,
        metadata: {},
        previous_hash: prev,
        entry_hash: hash,
        created_at: payload.created_at,
      });
      prev = hash;
    }
    const result = svc._verifyRowsSequential(rows, Date.now());
    expect(result.ok).toBe(true);
    expect(result.firstCorruptionId).toBeNull();
  });
});
