-- Create investments table for the 24-hour profit system
-- This table stores investment records with automatic profit scheduling

CREATE TABLE IF NOT EXISTS investments (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    transaction_id INTEGER NOT NULL,
    plan_name VARCHAR(255) NOT NULL,
    plan_duration INTEGER NOT NULL,
    daily_profit DECIMAL(5,2) NOT NULL,
    total_return DECIMAL(5,2) NOT NULL,
    principal_amount DECIMAL(15,2) NOT NULL,
    start_date TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
    days_elapsed INTEGER NOT NULL DEFAULT 0,
    total_earned DECIMAL(15,2) NOT NULL DEFAULT 0,
    last_return_applied TIMESTAMP WITH TIME ZONE,
    first_profit_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Create investment_returns table for tracking daily returns
CREATE TABLE IF NOT EXISTS investment_returns (
    id SERIAL PRIMARY KEY,
    investment_id INTEGER NOT NULL REFERENCES investments(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL,
    amount DECIMAL(15,2) NOT NULL,
    return_date TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_investments_user_id ON investments(user_id);
CREATE INDEX IF NOT EXISTS idx_investments_status ON investments(status);
CREATE INDEX IF NOT EXISTS idx_investments_transaction_id ON investments(transaction_id);
CREATE INDEX IF NOT EXISTS idx_investments_first_profit_date ON investments(first_profit_date) WHERE first_profit_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_investments_last_return_applied ON investments(last_return_applied);
CREATE INDEX IF NOT EXISTS idx_investment_returns_investment_id ON investment_returns(investment_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_user_id ON investment_returns(user_id);
CREATE INDEX IF NOT EXISTS idx_investment_returns_return_date ON investment_returns(return_date);

-- Add comments for documentation
COMMENT ON TABLE investments IS 'Stores investment records with automatic profit scheduling';
COMMENT ON COLUMN investments.first_profit_date IS 'Date when the first profit should be applied (24 hours after deposit approval)';
COMMENT ON COLUMN investments.last_return_applied IS 'Date when the last return was applied to this investment';
COMMENT ON TABLE investment_returns IS 'Stores individual daily return records for investments';

COMMIT;
