import crypto from "crypto";
import { log } from "./logger";
import { supabase } from "./supabase";

export interface LedgerEntryInput {
  userId: number;
  entryType: string; // e.g. deposit, withdrawal, investment_lock
  amountDelta: number; // signed change to available balance
  activeDepositsDelta?: number; // signed change to active principal
  balanceAfter: number; // resulting available balance
  activeDepositsAfter: number; // resulting active deposits
  referenceTable?: string;
  referenceId?: number;
  metadata?: Record<string, any>;
}

export class FinancialLedgerService {
  /**
   * Record an immutable ledger entry. Computes hash-chaining for tamper detection.
   */
  async record(
    entry: LedgerEntryInput
  ): Promise<{ success: boolean; id?: number; error?: string }> {
    try {
      const prevHash = await this.getLastHash(entry.userId);
      const entryHash = this.computeHash({ ...entry, previousHash: prevHash });
      const payload: any = {
        user_id: entry.userId,
        entry_type: entry.entryType,
        amount_delta: entry.amountDelta,
        active_deposits_delta: entry.activeDepositsDelta || 0,
        balance_after: entry.balanceAfter,
        active_deposits_after: entry.activeDepositsAfter,
        reference_table: entry.referenceTable || null,
        reference_id: entry.referenceId || null,
        metadata: entry.metadata || {},
        previous_hash: prevHash,
        entry_hash: entryHash,
      };
      const { data, error } = await supabase
        .from("financial_ledger")
        .insert(payload)
        .select("id")
        .single();
      if (error) {
        log.error("ledger.record.fail", error, {
          userId: entry.userId,
          entryType: entry.entryType,
        });
        return { success: false, error: "insert_failed" };
      }
      log.info("ledger.record", {
        userId: entry.userId,
        entryType: entry.entryType,
        id: data?.id,
      });
      return { success: true, id: data?.id };
    } catch (e) {
      log.error("ledger.record.exception", e, {
        userId: entry.userId,
        entryType: entry.entryType,
      });
      return { success: false, error: "exception" };
    }
  }

  /**
   * Verify the entire ledger (optionally constrained by id range) in streaming chunks.
   * Returns first corruption id if detected. This is O(n) over selected rows.
   */
  async verifyLedger(
    options: {
      fromId?: number;
      toId?: number;
      chunkSize?: number;
      sample?: number; // if provided, randomly sample up to N ids inside range (approx, simple stride)
    } = {}
  ): Promise<{
    ok: boolean;
    checked: number;
    firstCorruptionId?: number | null;
    hashMismatches: number;
    durationMs: number;
  }> {
    const start = Date.now();
    const chunkSize =
      options.chunkSize && options.chunkSize > 0 ? options.chunkSize : 500;
    const filters: string[] = [];
    if (options.fromId) filters.push(`id >= ${options.fromId}`);
    if (options.toId) filters.push(`id <= ${options.toId}`);
    const whereClause = filters.length ? `WHERE ${filters.join(" AND ")}` : "";
    // Fetch id bounds first for sampling
    let idsQuery = `select id, previous_hash, entry_hash, user_id, entry_type, amount_delta, active_deposits_delta, balance_after, active_deposits_after, reference_table, reference_id, metadata, created_at from financial_ledger ${whereClause} order by id asc`;
    // If sampling, we will lazy stride through results without loading all into memory at once – emulate by selecting all ids then iterating with stride.
    const { data: allRows, error } =
      (await supabase.rpc?.("exec_sql", { sql: idsQuery })) ||
      ({ data: null, error: new Error("exec_sql not available") } as any);
    if (error || !allRows) {
      // Fallback: attempt standard select limited (may not scale for huge ledgers)
      try {
        const { data: fallback, error: fbErr } = await supabase
          .from("financial_ledger")
          .select("*")
          .order("id", { ascending: true })
          .limit(options.sample ? options.sample : 5000);
        if (fbErr || !fallback)
          return {
            ok: false,
            checked: 0,
            hashMismatches: 0,
            firstCorruptionId: -1,
            durationMs: Date.now() - start,
          };
        return this._verifyRowsSequential(fallback, start);
      } catch (e) {
        return {
          ok: false,
          checked: 0,
          hashMismatches: 0,
          firstCorruptionId: -1,
          durationMs: Date.now() - start,
        };
      }
    }
    let rows: any[] = allRows;
    if (options.sample && rows.length > options.sample) {
      const stride = Math.max(1, Math.floor(rows.length / options.sample));
      rows = rows
        .filter((_, idx) => idx % stride === 0)
        .slice(0, options.sample);
    }
    return this._verifyRowsSequential(rows, start);
  }

  // Exposed for test instrumentation (synthetic corruption scenarios)
  _verifyRowsSequential(rows: any[], start: number) {
    let prevHash: string | null = null;
    let mismatches = 0;
    for (const row of rows) {
      if (row.previous_hash !== prevHash) {
        return {
          ok: false,
          checked: rows.length,
          firstCorruptionId: row.id,
          hashMismatches: ++mismatches,
          durationMs: Date.now() - start,
        };
      }
      const recomputed = this.computeHash({
        userId: row.user_id,
        entryType: row.entry_type,
        amountDelta: Number(row.amount_delta),
        activeDepositsDelta: Number(row.active_deposits_delta),
        balanceAfter: Number(row.balance_after),
        activeDepositsAfter: Number(row.active_deposits_after),
        referenceTable: row.reference_table || undefined,
        referenceId: row.reference_id || undefined,
        metadata: row.metadata || undefined,
        previousHash: row.previous_hash || undefined,
        created_at: row.created_at,
      });
      if (recomputed !== row.entry_hash) {
        mismatches++;
        return {
          ok: false,
          checked: rows.length,
          firstCorruptionId: row.id,
          hashMismatches: mismatches,
          durationMs: Date.now() - start,
        };
      }
      prevHash = row.entry_hash;
    }
    return {
      ok: true,
      checked: rows.length,
      firstCorruptionId: null,
      hashMismatches: 0,
      durationMs: Date.now() - start,
    };
  }
  /**
   * Verify hash chain integrity for a user (optional expensive operation)
   */
  async verifyChain(
    userId: number,
    limit = 500
  ): Promise<{ valid: boolean; breakIndex?: number }> {
    const { data, error } = await supabase
      .from("financial_ledger")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: true })
      .limit(limit);
    if (error || !data) return { valid: false, breakIndex: -1 };
    let prevHash: string | null = null;
    for (let i = 0; i < data.length; i++) {
      const row: any = data[i];
      if (row.previous_hash !== prevHash)
        return { valid: false, breakIndex: i };
      const recomputed = this.computeHash({
        userId: row.user_id,
        entryType: row.entry_type,
        amountDelta: Number(row.amount_delta),
        activeDepositsDelta: Number(row.active_deposits_delta),
        balanceAfter: Number(row.balance_after),
        activeDepositsAfter: Number(row.active_deposits_after),
        referenceTable: row.reference_table || undefined,
        referenceId: row.reference_id || undefined,
        metadata: row.metadata || undefined,
        previousHash: row.previous_hash || undefined,
        created_at: row.created_at,
      });
      if (recomputed !== row.entry_hash) return { valid: false, breakIndex: i };
      prevHash = row.entry_hash;
    }
    return { valid: true };
  }

  private async getLastHash(userId: number): Promise<string | null> {
    const { data, error } = await supabase
      .from("financial_ledger")
      .select("entry_hash")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) return null;
    return (data as any)?.entry_hash || null;
  }

  // Public for corruption simulation tests
  computeHash(payload: any): string {
    const {
      userId,
      entryType,
      amountDelta,
      activeDepositsDelta = 0,
      balanceAfter,
      activeDepositsAfter,
      previousHash = "",
      referenceTable = "",
      referenceId = "",
      metadata = {},
      created_at = new Date().toISOString(),
    } = payload;
    const base = [
      previousHash,
      userId,
      entryType,
      amountDelta,
      activeDepositsDelta,
      balanceAfter,
      activeDepositsAfter,
      referenceTable,
      referenceId,
      JSON.stringify(metadata),
      created_at,
    ].join(":");
    return crypto.createHash("sha256").update(base).digest("hex");
  }
}

export const financialLedger = new FinancialLedgerService();
