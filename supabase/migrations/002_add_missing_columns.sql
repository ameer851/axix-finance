-- Add missing columns to users table (safe column additions)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS two_factor_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS verification_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_reset_token_expiry TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS pending_email VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bitcoin_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bitcoin_cash_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS ethereum_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bnb_address VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS usdt_trc20_address VARCHAR(255);

-- Add missing columns to transactions table
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS processed_by INTEGER;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS transaction_hash VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS crypto_type VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS wallet_address VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plan_name VARCHAR(255);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS plan_duration VARCHAR(100);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS daily_profit DECIMAL(15,8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS total_return DECIMAL(15,8);
ALTER TABLE transactions ADD COLUMN IF NOT EXISTS expected_completion_date TIMESTAMP WITH TIME ZONE;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_transactions_plan_name ON transactions(plan_name);
CREATE INDEX IF NOT EXISTS idx_transactions_status_type ON transactions(status, type);
CREATE INDEX IF NOT EXISTS idx_users_bitcoin_address ON users(bitcoin_address);
CREATE INDEX IF NOT EXISTS idx_users_ethereum_address ON users(ethereum_address);
