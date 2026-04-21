-- 012_remove_stripe.sql
-- Remove Stripe-only infrastructure: subscriptions table and subscriber access type

-- Drop RLS policies on subscriptions
drop policy if exists "Users can read own subscription" on public.subscriptions;
drop policy if exists "Admins can read all subscriptions" on public.subscriptions;

-- Drop the table
drop table if exists public.subscriptions;

-- Migrate stale access_type values before tightening constraint
update public.tracks set access_type = 'one_off' where access_type = 'subscriber';
update public.tracks set access_type = 'one_off' where access_type = 'hybrid';

-- Tighten access_type to only public | one_off
alter table public.tracks drop constraint if exists tracks_access_type_check;
alter table public.tracks add constraint tracks_access_type_check
  check (access_type in ('public', 'one_off'));

-- Remove 'subscription' from entitlements source
alter table public.entitlements drop constraint if exists entitlements_source_check;
alter table public.entitlements add constraint entitlements_source_check
  check (source in ('purchase', 'grant'));
