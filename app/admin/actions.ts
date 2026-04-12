"use server";

import { createClient, createAdminClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/shopify/products";
import { revalidatePath } from "next/cache";

async function verifyAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Unauthorized");

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profile?.role !== "admin") throw new Error("Forbidden");
}

export async function syncShopifyProducts() {
  await verifyAdmin();

  const { products } = await getProducts({ first: 50, sortKey: "TITLE" });
  const admin = createAdminClient();

  const rows = products.map((p) => ({
    shopify_id: p.id,
    title: p.title,
    handle: p.handle,
    image_url: p.featuredImage?.url ?? null,
    price: p.priceRange.minVariantPrice.amount,
    updated_at: new Date().toISOString(),
  }));

  if (rows.length === 0) {
    return { synced: 0, error: "No products found in Shopify" };
  }

  const { error } = await admin
    .from("product_cache")
    .upsert(rows, { onConflict: "shopify_id" });

  if (error) throw new Error(`Sync failed: ${error.message}`);

  revalidatePath("/admin");
  revalidatePath("/admin/tracks");

  return { synced: rows.length };
}
