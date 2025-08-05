-- Create deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth.users(id),
    amount DECIMAL(18, 8) NOT NULL,
    STATUS VARCHAR(50) DEFAULT 'pending',
    transaction_hash VARCHAR(255),
    currency VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by INTEGER REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    network VARCHAR(50),
    wallet_address VARCHAR(255)
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES auth.users(id),
    amount DECIMAL(18, 8) NOT NULL,
    STATUS VARCHAR(50) DEFAULT 'pending',
    transaction_hash VARCHAR(255),
    currency VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    approved_by INTEGER REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    network VARCHAR(50),
    wallet_address VARCHAR(255)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);

CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(STATUS);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(STATUS);

-- Add RLS policies
ALTER TABLE public.deposits ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Users can view their own deposits
CREATE POLICY deposits_select_policy ON public.deposits FOR
SELECT USING (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'admin'
    );

-- Users can create their own deposits
CREATE POLICY deposits_insert_policy ON public.deposits FOR
INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update deposits
CREATE POLICY deposits_update_policy ON public.deposits FOR
UPDATE USING (auth.jwt()->>'role' = 'admin');

-- Users can view their own withdrawals
CREATE POLICY withdrawals_select_policy ON public.withdrawals FOR
SELECT USING (
        auth.uid() = user_id
        OR auth.jwt()->>'role' = 'admin'
    );

-- Users can create their own withdrawals
CREATE POLICY withdrawals_insert_policy ON public.withdrawals FOR
INSERT WITH CHECK (auth.uid() = user_id);

-- Only admins can update withdrawals
CREATE POLICY withdrawals_update_policy ON public.withdrawals FOR
UPDATE USING (auth.jwt()->>'role' = 'admin');