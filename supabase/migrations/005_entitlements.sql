-- 005_entitlements.sql
-- Track access entitlements (future — structure only)

create table public.entitlements (
  user_id uuid not null references public.profiles(id) on delete cascade,
  track_id uuid not null references public.tracks(id) on delete cascade,
  source text not null check (source in ('purchase', 'subscription', 'grant')),
  created_at timestamptz not null default now(),
  primary key (user_id, track_id)
);

-- RLS
alter table public.entitlements enable row level security;

-- Users can read their own entitlements
create policy "Users can read own entitlements"
  on public.entitlements for select
  using (auth.uid() = user_id);

-- Admins have full CRUD
create policy "Admins can manage entitlements"
  on public.entitlements for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
