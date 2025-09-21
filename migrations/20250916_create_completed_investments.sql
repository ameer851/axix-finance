-- Create completed investments history table
create table if not exists completed_investments (
  id bigserial primary key,
  original_investment_id integer not null references investments(id) on delete cascade,
  user_id integer not null,
  plan_name text not null,
  daily_profit numeric not null,
  duration integer not null,
  principal_amount numeric not null,
  total_earned numeric not null default 0,
  start_date timestamptz not null,
  end_date timestamptz not null,
  completed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists idx_completed_investments_user on completed_investments(user_id);
create index if not exists idx_completed_investments_completed_at on completed_investments(completed_at desc);
