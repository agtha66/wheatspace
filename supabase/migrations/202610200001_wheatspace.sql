-- WheatSpace serverless schema. Run only after confirming the target Supabase project.
create extension if not exists pgcrypto;

create table if not exists public.users (
  id uuid primary key default gen_random_uuid(),
  phone text unique not null,
  created_at timestamptz not null default now(),
  last_login_at timestamptz,
  is_active boolean not null default true
);

create table if not exists public.learning_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  action text not null default 'unknown',
  data jsonb not null default '{}'::jsonb,
  duration_seconds integer not null default 0 check (duration_seconds >= 0),
  created_at timestamptz not null default now()
);

create index if not exists learning_records_user_created_idx on public.learning_records(user_id, created_at desc);
create index if not exists learning_records_created_idx on public.learning_records(created_at desc);
alter table public.users enable row level security;
alter table public.learning_records enable row level security;
-- All access goes through the Edge Function using a server-side service role key.
revoke all on public.users, public.learning_records from anon, authenticated;
