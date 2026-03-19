-- 011_harden_rpc_permissions.sql
-- Revoke public access to SECURITY DEFINER RPC [HUGO-57]
-- Only service_role (admin client) should call replace_track_products.

REVOKE EXECUTE ON FUNCTION replace_track_products(UUID, TEXT[]) FROM anon;
REVOKE EXECUTE ON FUNCTION replace_track_products(UUID, TEXT[]) FROM authenticated;
