import { NextResponse } from "next/server";
import { requireAdminApi } from "@/lib/auth/guards";
import { shopifyFetch } from "@/lib/shopify/client";

const PRODUCTS_QUERY = `
  query AdminProducts($first: Int!) {
    products(first: $first, sortKey: TITLE) {
      edges {
        node {
          id
          title
          handle
          featuredImage { url }
        }
      }
    }
  }
`;

interface ProductNode {
  id: string;
  title: string;
  handle: string;
  featuredImage: { url: string } | null;
}

interface ProductsResult {
  products: { edges: { node: ProductNode }[] };
}

export async function GET() {
  const auth = await requireAdminApi();
  if (auth.error) return auth.error;

  try {
    const data = await shopifyFetch<ProductsResult>(PRODUCTS_QUERY, {
      first: 50,
    });

    const simplified = data.products.edges.map(({ node }) => ({
      id: node.id,
      title: node.title,
      handle: node.handle,
      image: node.featuredImage?.url ?? null,
    }));

    return NextResponse.json(simplified);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("[admin/products] Shopify fetch failed:", message);
    return NextResponse.json(
      { error: "Failed to fetch products", detail: message },
      { status: 500 }
    );
  }
}
