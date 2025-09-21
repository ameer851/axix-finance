-- Migration: job_runs table for tracking scheduled / manual job executions
-- Created at 2025-09-19

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
  source TEXT, -- 'cron' | 'manual' | 'api'
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Materialized UTC calendar date derived from started_at (stored for immutable unique index)
  run_date DATE GENERATED ALWAYS AS ((started_at AT TIME ZONE 'UTC')::date) STORED
  -- NOTE: Can't use a cast expression directly inside a table-level UNIQUE constraint in this form.
  -- Per-day uniqueness will be enforced via a separate expression unique index below.
);

CREATE INDEX IF NOT EXISTS idx_job_runs_job_name_started_at ON job_runs(job_name, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_job_runs_success ON job_runs(job_name, success, started_at DESC);
-- Enforce one run per job_name per UTC calendar day
-- Unique per job per UTC day using materialized run_date
CREATE UNIQUE INDEX IF NOT EXISTS idx_job_runs_one_per_day ON job_runs (job_name, run_date);
