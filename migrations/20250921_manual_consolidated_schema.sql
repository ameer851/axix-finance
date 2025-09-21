-- Consolidated Manual Migration Script (Run Once in Production BEFORE new code deploy)
-- Date: 2025-09-21
-- Purpose: Ensure critical new tables & columns exist (job_runs, financial_ledger, numeric normalization)
-- Safe to re-run: Uses IF NOT EXISTS and conditional guards.

BEGIN;

-- 1. job_runs table (cron idempotency & observability)
CREATE TABLE IF NOT EXISTS job_runs (
  id BIGSERIAL PRIMARY KEY,
  job_name TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  finished_at TIMESTAMPTZ,
  success BOOLEAN,
  processed_count INTEGER DEFAULT 0,
  completed_count INTEGER DEFAULT 0,
  total_applied NUMERIC(18,6) DEFAULT 0,
  error_text TEXT,
  source TEXT,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  run_date DATE GENERATED ALWAYS AS ((started_at AT TIME ZONE 'UTC')::date) STORED
);

CREATE INDEX IF NOT EXISTS idx_job_runs_job_name_started_at ON job_runs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_success ON job_runs(job_name, success, started_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_runs_one_per_day ON job_runs(job_name, run_date);

-- 2. financial_ledger table (append-only hash chained ledger)
CREATE TABLE IF NOT EXISTS financial_ledger (
  id BIGSERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_type TEXT NOT NULL,
  reference_table TEXT,
  reference_id BIGINT,
  amount_delta NUMERIC(18,6) NOT NULL,
  active_deposits_delta NUMERIC(18,6) DEFAULT 0,
  balance_after NUMERIC(18,6) NOT NULL,
  active_deposits_after NUMERIC(18,6) NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  previous_hash TEXT,
  entry_hash TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_financial_ledger_user_created_at ON financial_ledger(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_financial_ledger_entry_type ON financial_ledger(entry_type);

-- 3. Numeric normalization / new columns on users
-- Add earned_money column if missing
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name='users' AND column_name='earned_money'
  ) THEN
    ALTER TABLE users ADD COLUMN earned_money NUMERIC(15,2) DEFAULT 0.00;
  END IF;
END$$;

-- Ensure balance & active_deposits columns are NUMERIC(15,2)
DO $$
DECLARE
  bal_type text;
  bal_precision int;
  bal_scale int;
  act_type text;
  act_precision int;
  act_scale int;
BEGIN
  SELECT data_type, numeric_precision, numeric_scale
    INTO bal_type, bal_precision, bal_scale
  FROM information_schema.columns
  WHERE table_name='users' AND column_name='balance';

  SELECT data_type, numeric_precision, numeric_scale
    INTO act_type, act_precision, act_scale
  FROM information_schema.columns
  WHERE table_name='users' AND column_name='active_deposits';

  -- Normalize balance
  IF bal_type IS NOT NULL THEN
    IF bal_type = 'numeric' THEN
      -- Already numeric: only adjust precision/scale if needed
      IF bal_precision IS DISTINCT FROM 15 OR bal_scale IS DISTINCT FROM 2 THEN
        EXECUTE 'ALTER TABLE users ALTER COLUMN balance TYPE NUMERIC(15,2)';
        EXECUTE 'ALTER TABLE users ALTER COLUMN balance SET DEFAULT 0.00';
      END IF;
    ELSIF bal_type IN ('character varying','text') THEN
      -- Text/Varchar: sanitize then cast
      EXECUTE 'ALTER TABLE users ALTER COLUMN balance DROP DEFAULT';
      EXECUTE 'UPDATE users SET balance = ''0'' WHERE balance IS NULL OR trim(balance) = '''' OR balance !~ ''^[0-9\\.\\-]+$''';
      EXECUTE 'ALTER TABLE users ALTER COLUMN balance TYPE NUMERIC(15,2) USING NULLIF(trim(balance),'''')::numeric';
      EXECUTE 'ALTER TABLE users ALTER COLUMN balance SET DEFAULT 0.00';
    END IF;
  END IF;

  -- Normalize active_deposits
  IF act_type IS NOT NULL THEN
    IF act_type = 'numeric' THEN
      IF act_precision IS DISTINCT FROM 15 OR act_scale IS DISTINCT FROM 2 THEN
        EXECUTE 'ALTER TABLE users ALTER COLUMN active_deposits TYPE NUMERIC(15,2)';
        EXECUTE 'ALTER TABLE users ALTER COLUMN active_deposits SET DEFAULT 0.00';
      END IF;
    ELSIF act_type IN ('character varying','text') THEN
      EXECUTE 'ALTER TABLE users ALTER COLUMN active_deposits DROP DEFAULT';
      EXECUTE 'UPDATE users SET active_deposits = ''0'' WHERE active_deposits IS NULL OR trim(active_deposits) = '''' OR active_deposits !~ ''^[0-9\\.\\-]+$''';
      EXECUTE 'ALTER TABLE users ALTER COLUMN active_deposits TYPE NUMERIC(15,2) USING NULLIF(trim(active_deposits),'''')::numeric';
      EXECUTE 'ALTER TABLE users ALTER COLUMN active_deposits SET DEFAULT 0.00';
    END IF;
  END IF;
END$$;

COMMIT;

-- =====================
-- VERIFICATION QUERIES
-- (Run after commit to confirm schema state)
-- =====================
-- Check job_runs uniqueness enforcement and recent rows
--   SELECT job_name, run_date, COUNT(*) FROM job_runs GROUP BY 1,2 HAVING COUNT(*)>1;
--   SELECT * FROM job_runs ORDER BY started_at DESC LIMIT 5;
-- Check financial_ledger structural integrity
--   SELECT COUNT(*) AS total_entries FROM financial_ledger;
--   SELECT id, user_id, entry_type, previous_hash, entry_hash FROM financial_ledger ORDER BY id DESC LIMIT 5;
-- Check users numeric columns
--   \d+ users  -- (psql) ensure balance, active_deposits, earned_money are NUMERIC(15,2)
--   SELECT balance, active_deposits, earned_money FROM users ORDER BY id LIMIT 5;
-- Optional: create a test ledger entry (application layer preferred) then verify hash chain via admin endpoint.

-- If rolling back (not recommended post-deploy): Only drop new objects if empty / unused.
--   BEGIN; DROP TABLE IF EXISTS financial_ledger; DROP TABLE IF EXISTS job_runs; ALTER TABLE users DROP COLUMN IF EXISTS earned_money; COMMIT;
