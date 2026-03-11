-- 009_replace_track_products_rpc.sql
-- Atomic product mapping replacement for tracks [HUGO-44]

CREATE OR REPLACE FUNCTION replace_track_products(
  p_track_id UUID,
  p_product_ids TEXT[]
) RETURNS void AS $$
BEGIN
  DELETE FROM track_product_map WHERE track_id = p_track_id;

  IF array_length(p_product_ids, 1) IS NOT NULL THEN
    INSERT INTO track_product_map (track_id, shopify_product_id)
    SELECT p_track_id, unnest(p_product_ids);
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
