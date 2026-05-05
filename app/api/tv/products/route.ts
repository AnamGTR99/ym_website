import { NextResponse } from "next/server";
import { getProducts } from "@/lib/shopify/products";

// Public endpoint — no auth required. Fetches products directly from Shopify.
export async function GET() {
  try {
    const { products } = await getProducts({ first: 50 });

    // Map to the shape the TV grid expects
    const mapped = products.map((p) => ({
      shopify_id: p.id,
      title: p.title,
      handle: p.handle,
      price: p.priceRange.minVariantPrice.amount,
      image_url: p.featuredImage?.url ?? null,
    }));

    return NextResponse.json(mapped);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
