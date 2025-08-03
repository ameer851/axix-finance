-- Add missing columns to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "firstName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "lastName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "twoFactorSecret" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "verificationToken" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "verificationTokenExpiry" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "passwordResetToken" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "passwordResetTokenExpiry" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "pendingEmail" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bitcoinAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bitcoinCashAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "ethereumAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bnbAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "usdtTrc20Address" VARCHAR(255);

-- Update column names to match our schema (snake_case to camelCase mapping)
-- Note: These columns already exist but may need to be accessible with snake_case names
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS "first_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "last_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "two_factor_enabled" BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS "two_factor_secret" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "verification_token" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "verification_token_expiry" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "password_reset_token" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "password_reset_token_expiry" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "pending_email" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bitcoin_address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bitcoin_cash_address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "ethereum_address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "bnb_address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "usdt_trc20_address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "referred_by" INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "updated_at" TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS "is_verified" BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS "is_active" BOOLEAN DEFAULT true;

-- Add missing columns to transactions table
ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS "processedBy" INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT,
ADD COLUMN IF NOT EXISTS "transactionHash" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "cryptoType" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "walletAddress" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "planName" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "planDuration" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "dailyProfit" DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS "totalReturn" DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS "expectedCompletionDate" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "processed_by" INTEGER REFERENCES users(id),
ADD COLUMN IF NOT EXISTS "rejection_reason" TEXT,
ADD COLUMN IF NOT EXISTS "transaction_hash" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "crypto_type" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "wallet_address" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "plan_name" VARCHAR(255),
ADD COLUMN IF NOT EXISTS "plan_duration" VARCHAR(100),
ADD COLUMN IF NOT EXISTS "daily_profit" DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS "total_return" DECIMAL(15,8),
ADD COLUMN IF NOT EXISTS "expected_completion_date" TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS "user_id" INTEGER REFERENCES users(id);

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_transactions_plan_name ON transactions("plan_name");
CREATE INDEX IF NOT EXISTS idx_transactions_status_type ON transactions(status, type);
CREATE INDEX IF NOT EXISTS idx_users_bitcoin_address ON users("bitcoin_address");
CREATE INDEX IF NOT EXISTS idx_users_ethereum_address ON users("ethereum_address");
