-- =============================================
-- FlowMap — Supabase Database Setup
-- Cole isso no SQL Editor do Supabase e clique Run
-- =============================================

-- Tabela de assinaturas
create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  email text not null unique,
  plan text not null default 'starter',
  stripe_subscription_id text,
  stripe_customer_id text,
  status text default 'trialing',
  trial_end timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Row Level Security
alter table subscriptions enable row level security;

create policy "Users can read own subscription"
  on subscriptions for select
  using (email = auth.jwt() ->> 'email');

create policy "Service role full access"
  on subscriptions for all
  using (auth.role() = 'service_role');

-- Tabela de sessões gravadas (para replay)
create table if not exists sessions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  symbol text not null,
  started_at timestamptz default now(),
  ended_at timestamptz,
  plan_required text default 'pro'
);

alter table sessions enable row level security;

create policy "Users can manage own sessions"
  on sessions for all
  using (user_id = auth.uid());

-- =============================================
-- Verificar se foi criado:
-- select * from subscriptions;
-- select * from sessions;
-- =============================================
