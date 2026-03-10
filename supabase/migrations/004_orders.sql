-- 004_orders.sql
-- Orders synced from Shopify webhooks

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  shopify_order_id text unique not null,
  shopify_order_number text,
  email text not null,
  total_price text not null,
  currency text not null default 'USD',
  line_items jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

-- Index for email lookups (retroactive order linking)
create index idx_orders_email on public.orders(email);

-- RLS
alter table public.orders enable row level security;

-- Users can read their own orders
create policy "Users can read own orders"
  on public.orders for select
  using (auth.uid() = user_id);

-- Admins can read all orders
create policy "Admins can read all orders"
  on public.orders for select
  using (
    exists (
      select 1 from public.profiles
      where id = auth.uid() and role = 'admin'
    )
  );

-- Service role inserts orders (via webhook handler) — no user policy needed
