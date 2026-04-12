import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";

// Public endpoint — no auth required. Returns cached Shopify products.
export async function GET() {
  try {
    const supabase = createAdminClient();
    const { data, error } = await supabase
      .from("product_cache")
      .select("shopify_id, title, handle, price, image_url")
      .order("title");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data ?? []);
  } catch {
    return NextResponse.json([], { status: 500 });
  }
}
