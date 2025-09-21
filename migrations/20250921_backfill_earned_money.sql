-- Migration: Backfill users.earned_money from investment_returns (Option B)
-- Date: 2025-09-21
-- Idempotent: Only updates rows where earned_money is NULL or 0.00 and a sum exists.

BEGIN;

-- Safety snapshot (optional). Comment out if not needed.
-- CREATE TABLE IF NOT EXISTS users_earned_money_backup AS
--   SELECT id, earned_money, balance, active_deposits FROM users
--   WHERE NOT EXISTS (SELECT 1 FROM users_earned_money_backup);

WITH returns AS (
  SELECT user_id, COALESCE(SUM(amount),0) AS total_returns
  FROM investment_returns
  GROUP BY user_id
), to_update AS (
  SELECT u.id, r.total_returns
  FROM users u
  JOIN returns r ON r.user_id = u.id
  WHERE (u.earned_money IS NULL OR u.earned_money = 0)
    AND r.total_returns > 0
)
UPDATE users u
SET earned_money = to_update.total_returns
FROM to_update
WHERE u.id = to_update.id;

COMMIT;

-- Verification:
-- SELECT SUM(amount) FROM investment_returns;
-- SELECT SUM(earned_money) FROM users;
-- SELECT id, earned_money FROM users ORDER BY earned_money DESC LIMIT 20;