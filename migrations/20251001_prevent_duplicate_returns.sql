-- Migration: Add unique constraint to prevent duplicate investment returns per day
-- This prevents the same investment from having multiple returns on the same date

-- Add unique constraint on investment_id + return_date
-- This ensures each investment can only have one return entry per date
CREATE UNIQUE INDEX IF NOT EXISTS idx_investment_returns_unique_per_day 
ON investment_returns (investment_id, return_date);

-- Optionally, clean up any existing duplicates before applying constraint
-- (This would need to be run manually if duplicates exist)
-- 
-- -- Keep only the earliest created_at for each investment_id + return_date combination
-- DELETE FROM investment_returns 
-- WHERE id NOT IN (
--     SELECT MIN(id)
--     FROM investment_returns 
--     GROUP BY investment_id, return_date
-- );