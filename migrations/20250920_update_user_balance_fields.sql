ALTER TABLE users ADD COLUMN earned_money NUMERIC(15, 2) DEFAULT 0.00;
ALTER TABLE users ALTER COLUMN balance TYPE NUMERIC(15, 2) USING balance::numeric;
ALTER TABLE users ALTER COLUMN active_deposits TYPE NUMERIC(15, 2) USING active_deposits::numeric;
