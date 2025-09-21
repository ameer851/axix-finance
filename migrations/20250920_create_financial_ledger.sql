-- Migration: Create financial_ledger append-only table for reconstructable balance & deposit/withdraw/investment history
-- Created at 2025-09-20
-- Purpose: Provide an immutable, chronological ledger of user financial state transitions enabling full reconciliation.

CREATE TABLE IF NOT EXISTS financial_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  -- Core classification of the event
  entry_type TEXT NOT NULL, -- e.g. 'deposit','withdrawal','investment_lock','investment_unlock','daily_return','investment_completion','adjustment'
  reference_table TEXT,     -- optional source table name (transactions, investments, job_runs, etc.)
  reference_id BIGINT,      -- optional source row id
  amount_delta NUMERIC(18,6) NOT NULL, -- signed change to available balance (0 if only locked moved)
  active_deposits_delta NUMERIC(18,6) DEFAULT 0, -- signed change to active/principal locked value
  balance_after NUMERIC(18,6) NOT NULL,          -- resulting available balance after applying delta
  active_deposits_after NUMERIC(18,6) NOT NULL,  -- resulting active deposits after applying delta
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Hash chain for tamper detection: sha256(previous_hash || ':' || user_id || ':' || amount_delta || ':' || balance_after || ':' || created_at)
  previous_hash TEXT,
  entry_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_user_created_at ON financial_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_entry_type ON financial_ledger(entry_type);

-- Enforce append-only by revoking UPDATE/DELETE for public (runtime client) role if such exists.
-- (Actual permission revocation should be handled separately if using RLS / dedicated roles.)

-- Simple trigger to validate hash chain continuity (optional, can be added later for performance reasons)
-- For now we rely on application layer to compute and persist hashes.
