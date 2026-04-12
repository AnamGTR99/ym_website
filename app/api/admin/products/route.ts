import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { getProducts } from "@/lib/shopify/products";

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const { products } = await getProducts({ first: 100, sortKey: "TITLE" });

    const simplified = products.map((p) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      image: p.featuredImage?.url ?? null,
    }));

    return NextResponse.json(simplified);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Failed to fetch products:", message);
    return NextResponse.json(
      { error: "Failed to fetch products", detail: message },
      { status: 500 }
    );
  }
}
