import { NextResponse } from "next/server";
import { getProductByHandle } from "@/lib/shopify/products";
import { getTracksByProductId } from "@/lib/supabase/tracks";
import { formatPrice } from "@/lib/shopify/utils";

// Public endpoint — feeds the TV's in-portal product detail view.
// Returns a single JSON blob with just the fields the CRT overlay needs
// plus the linked tracks. No auth required.
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ handle: string }> }
) {
  try {
    const { handle } = await params;
    const product = await getProductByHandle(handle);
    if (!product) {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    const tracks = await getTracksByProductId(product.id);
    const primaryVariant = product.variants[0] ?? null;

    return NextResponse.json({
      product: {
        id: product.id,
        handle: product.handle,
        title: product.title,
        description: product.description,
        price: formatPrice(
          product.priceRange.minVariantPrice.amount,
          product.priceRange.minVariantPrice.currencyCode
        ),
        image:
          product.images[0]?.url ?? product.featuredImage?.url ?? null,
        glbUrl: product.glbUrl,
        variantId: primaryVariant?.id ?? null,
        availableForSale: primaryVariant?.availableForSale ?? false,
      },
      tracks,
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "failed" },
      { status: 500 }
    );
  }
}
