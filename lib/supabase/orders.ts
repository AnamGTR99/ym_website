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
