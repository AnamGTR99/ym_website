-- 010_add_indexes.sql
-- Performance indexes on frequently queried columns

-- Lookups by shopify_product_id (composite PK leads with track_id, so this is needed)
create index idx_track_product_map_shopify_product_id
  on public.track_product_map(shopify_product_id);

-- User order history lookups
create index idx_orders_user_id
  on public.orders(user_id);

-- Published track filtering (used in RLS policy and storefront queries)
create index idx_tracks_published
  on public.tracks(published)
  where published = true;
