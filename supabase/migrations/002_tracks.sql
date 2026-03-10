-- 002_tracks.sql
-- Music track metadata

create table public.tracks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  artist text not null,
  description text,
  release_date date,
  duration_seconds int,
  cover_url text,
  audio_path text not null,
  access_type text not null default 'public'
    check (access_type in ('public', 'subscriber', 'one_off', 'hybrid')),
  published boolean not null default false,
  created_at timestamptz not null default now()
);

-- RLS
alter table public.tracks enable row level security;

-- Anyone can read published tracks
create policy "Anyone can read published tracks"
  on public.tracks for select
  using (published = true);

-- Admins have full CRUD
create policy "Admins can do anything with tracks"
  on public.tracks for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
