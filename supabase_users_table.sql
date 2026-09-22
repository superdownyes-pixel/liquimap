-- =============================================
-- LiquiMap — tabela public.users (painel admin / membros pagantes)
-- Cole no SQL Editor do Supabase e clique Run. Pode rodar mais de uma vez.
-- =============================================

create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  email       text,
  name        text,
  plan        text default 'trial',
  trial_start timestamptz,
  trial_end   timestamptz,
  is_paying   boolean default false,
  created_at  timestamptz default now()
);

alter table public.users enable row level security;

-- Remove a regra antiga que deixava QUALQUER visitante ler/editar todos os usuários
drop policy if exists "Admin full access" on public.users;
drop policy if exists "User sees own row" on public.users;

-- Usuário só LÊ a própria linha. Ninguém escreve pelo navegador:
-- escrita só pelo servidor (webhook Stripe e /api/admin/users com service role, que ignora RLS)
create policy "User sees own row" on public.users
  for select using (auth.uid() = id);

-- Cria a linha automaticamente quando alguém se cadastra
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.users (id, email, name, plan, is_paying, trial_start, created_at)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name', 'trial', false, now(), now())
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Cria linhas para usuários que já existiam e ficaram de fora
insert into public.users (id, email, name, plan, is_paying, created_at)
select u.id, u.email, u.raw_user_meta_data->>'full_name', 'trial', false, u.created_at
from auth.users u
on conflict (id) do nothing;

-- Marca como pagante quem já tem assinatura ativa no Stripe
do $$
begin
  if to_regclass('public.subscriptions') is not null then
    update public.users pu
    set is_paying = true, plan = s.plan
    from public.subscriptions s
    where lower(s.email) = lower(pu.email) and s.status in ('active', 'trialing');
  end if;
end $$;

-- Conferir:
-- select email, plan, is_paying from public.users order by created_at desc;

-- =============================================
-- Ajuste da tabela subscriptions para o novo webhook
-- (colunas que o webhook grava + e-mail único para o upsert funcionar)
-- =============================================
alter table public.subscriptions add column if not exists stripe_customer_id text;
alter table public.subscriptions add column if not exists trial_end timestamptz;
-- Se este comando der erro de duplicado, há e-mails repetidos em subscriptions: apague os antigos e rode de novo
create unique index if not exists subscriptions_email_key on public.subscriptions (email);
