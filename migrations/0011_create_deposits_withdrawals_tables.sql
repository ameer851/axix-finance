-- Create deposits table
CREATE TABLE IF NOT EXISTS public.deposits (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric(18, 2) NOT NULL CHECK (amount > 0),
    STATUS text NOT NULL CHECK (STATUS IN ('pending', 'approved', 'rejected')),
    payment_method text,
    transaction_id text,
    created_at timestamp WITH time zone DEFAULT NOW(),
    approved_at timestamp WITH time zone,
    rejected_at timestamp WITH time zone,
    notes text
);

-- Create withdrawals table
CREATE TABLE IF NOT EXISTS public.withdrawals (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id bigint REFERENCES public.users(id) ON DELETE CASCADE,
    amount numeric(18, 2) NOT NULL CHECK (amount > 0),
    STATUS text NOT NULL CHECK (STATUS IN ('pending', 'approved', 'rejected')),
    payment_method text,
    wallet_address text,
    transaction_id text,
    created_at timestamp WITH time zone DEFAULT NOW(),
    approved_at timestamp WITH time zone,
    rejected_at timestamp WITH time zone,
    notes text
);

-- Add balance column to users table if it doesn't exist
DO $$ BEGIN IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'users'
        AND column_name = 'balance'
) THEN
ALTER TABLE public.users
ADD COLUMN balance numeric(18, 2) NOT NULL DEFAULT 0;

END IF;

END $$;

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deposits_user_id ON public.deposits(user_id);

CREATE INDEX IF NOT EXISTS idx_deposits_status ON public.deposits(STATUS);

CREATE INDEX IF NOT EXISTS idx_deposits_created_at ON public.deposits(created_at);

CREATE INDEX IF NOT EXISTS idx_withdrawals_user_id ON public.withdrawals(user_id);

CREATE INDEX IF NOT EXISTS idx_withdrawals_status ON public.withdrawals(STATUS);

CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at);