-- Enable RLS
ALTER TABLE public.deposits enable ROW LEVEL SECURITY;

ALTER TABLE public.withdrawals enable ROW LEVEL SECURITY;

-- Create function to update user balance
CREATE OR REPLACE FUNCTION public.update_user_balance(p_user_id bigint, p_amount numeric) RETURNS void AS $$ BEGIN
UPDATE public.users
SET balance = balance + p_amount
WHERE id = p_user_id;

END;

$$ language plpgsql SECURITY DEFINER;

-- Create function to approve deposit
CREATE OR REPLACE FUNCTION public.approve_deposit(p_deposit_id uuid) RETURNS void AS $$
DECLARE v_deposit record;

BEGIN -- Get deposit details
SELECT * INTO v_deposit
FROM public.deposits
WHERE id = p_deposit_id
    AND STATUS = 'pending' FOR
UPDATE;

IF NOT found THEN raise exception 'Deposit not found or not in pending status';

END IF;

-- Update deposit status
UPDATE public.deposits
SET STATUS = 'approved',
    approved_at = NOW()
WHERE id = p_deposit_id;

-- Update user balance
perform public.update_user_balance(v_deposit.user_id, v_deposit.amount);

END;

$$ language plpgsql SECURITY DEFINER;

-- Create function to approve withdrawal
CREATE OR REPLACE FUNCTION public.approve_withdrawal(p_withdrawal_id uuid) RETURNS void AS $$
DECLARE v_withdrawal record;

BEGIN -- Get withdrawal details
SELECT * INTO v_withdrawal
FROM public.withdrawals
WHERE id = p_withdrawal_id
    AND STATUS = 'pending' FOR
UPDATE;

IF NOT found THEN raise exception 'Withdrawal not found or not in pending status';

END IF;

-- Update withdrawal status
UPDATE public.withdrawals
SET STATUS = 'approved',
    approved_at = NOW()
WHERE id = p_withdrawal_id;

-- Update user balance (subtract amount)
perform public.update_user_balance(v_withdrawal.user_id, - v_withdrawal.amount);

END;

$$ language plpgsql SECURITY DEFINER;

-- Create RLS policies
CREATE policy "Enable read access for admins" ON public.deposits FOR
SELECT USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );

CREATE policy "Enable read access for admins" ON public.withdrawals FOR
SELECT USING (
        auth.role() = 'authenticated'
        AND EXISTS (
            SELECT 1
            FROM public.users
            WHERE id = auth.uid()
                AND role = 'admin'
        )
    );