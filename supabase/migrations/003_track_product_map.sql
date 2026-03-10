-- 003_track_product_map.sql
-- Many-to-many: tracks <-> Shopify products

create table public.track_product_map (
  track_id uuid not null references public.tracks(id) on delete cascade,
  shopify_product_id text not null,
  created_at timestamptz not null default now(),
  primary key (track_id, shopify_product_id)
);

-- RLS
alter table public.track_product_map enable row level security;

-- Anyone can read mappings
create policy "Anyone can read track-product mappings"
  on public.track_product_map for select
  using (true);

-- Admins can modify mappings
create policy "Admins can modify track-product mappings"
  on public.track_product_map for all
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );
