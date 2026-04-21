import { createAdminClient } from "@/lib/supabase/server";

interface ShopifyLineItem {
  title: string;
  quantity: number;
  price: string;
  variant_title: string | null;
  product_id: number | null;
  sku: string | null;
}

interface ShopifyOrder {
  id: number;
  order_number: number;
  email: string;
  total_price: string;
  currency: string;
  line_items: ShopifyLineItem[];
  financial_status: string;
}

/**
 * Upsert a Shopify order into Supabase.
 * Idempotent — uses shopify_order_id as unique key.
 * Attempts to match order email to an existing profile.
 */
export async function upsertOrder(order: ShopifyOrder) {
  const supabase = createAdminClient();

  // Try to match email to an existing profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("email", order.email)
    .single();

  const lineItems = order.line_items.map((item) => ({
    title: item.title,
    quantity: item.quantity,
    price: item.price,
    variant_title: item.variant_title,
    product_id: item.product_id,
    sku: item.sku,
  }));

  const { error } = await supabase.from("orders").upsert(
    {
      shopify_order_id: String(order.id),
      shopify_order_number: String(order.order_number),
      email: order.email,
      total_price: order.total_price,
      currency: order.currency,
      line_items: lineItems,
      status: order.financial_status,
      user_id: profile?.id ?? null,
    },
    { onConflict: "shopify_order_id" }
  );

  if (error) {
    throw new Error(`Failed to upsert order: ${error.message}`);
  }
}

/**
 * Link unclaimed orders to a user profile by email match.
 * Call this when a user signs up to retroactively associate their orders.
 */
export async function linkUnclaimedOrders(userId: string, email: string) {
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("orders")
    .update({ user_id: userId })
    .eq("email", email)
    .is("user_id", null);

  if (error) {
    throw new Error(`Failed to link orders: ${error.message}`);
  }
}

/**
 * Grant track entitlements for an order's line items.
 * Looks up track_product_map for each product_id in the order,
 * then inserts entitlements for the matched user.
 */
export async function grantEntitlementsForOrder(
  userId: string,
  lineItems: { product_id: number | null }[]
) {
  const supabase = createAdminClient();

  const numericProductIds = lineItems
    .map((li) => li.product_id)
    .filter((id): id is number => id !== null);

  if (numericProductIds.length === 0) return;

  // track_product_map stores Shopify GIDs (from Storefront API),
  // but webhooks send numeric product_id — check both formats
  const productIdVariants = numericProductIds.flatMap((id) => [
    String(id),
    `gid://shopify/Product/${id}`,
  ]);

  const { data: mappings, error: mapError } = await supabase
    .from("track_product_map")
    .select("track_id")
    .in("shopify_product_id", productIdVariants);

  if (mapError || !mappings || mappings.length === 0) return;

  const trackIds = [...new Set(mappings.map((m) => m.track_id))];

  const rows = trackIds.map((trackId) => ({
    user_id: userId,
    track_id: trackId,
    source: "purchase" as const,
  }));

  const { error: insertError } = await supabase
    .from("entitlements")
    .upsert(rows, { onConflict: "user_id,track_id", ignoreDuplicates: true });

  if (insertError) {
    console.error("[grantEntitlementsForOrder] insert error:", insertError.message);
  }
}

/**
 * Grant entitlements for all orders belonging to a user.
 * Call after linkUnclaimedOrders to retroactively grant access
 * for purchases made before the user created an account.
 */
export async function grantEntitlementsForUser(userId: string) {
  const supabase = createAdminClient();

  const { data: orders, error } = await supabase
    .from("orders")
    .select("line_items")
    .eq("user_id", userId);

  if (error || !orders || orders.length === 0) return;

  const allLineItems = orders.flatMap(
    (order) => (order.line_items as { product_id: number | null }[]) ?? []
  );

  await grantEntitlementsForOrder(userId, allLineItems);
}
