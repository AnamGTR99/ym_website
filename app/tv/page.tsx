import Link from "next/link";
import TVGrid from "@/components/tv/TVGrid";
import { getProducts } from "@/lib/shopify/products";

export const revalidate = 60;

export default async function TVPage() {
  let products: import("@/lib/shopify/types").ShopifyProduct[] = [];
  let error: string | null = null;

  try {
    const result = await getProducts({ first: 50, sortKey: "TITLE" });
    products = result.products;
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Failed to load products from Shopify";
    products = [];
  }

  return (
    <main className="grain min-h-screen flex flex-col items-center px-4 pt-6 pb-12 bg-void">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        <div className="flex items-center justify-between animate-fade-down">
          <div>
            <p className="text-label text-fog">Yunmakai TV</p>
            <h1 className="text-display-md text-bone mt-1">Channel Grid</h1>
          </div>
          <Link
            href="/room?tv=1"
            className="text-xs font-mono text-fog hover:text-amber transition-colors"
          >
            ← Back to Room
          </Link>
        </div>

        {error && (
          <div className="border border-error/30 bg-error/5 rounded px-4 py-3">
            <p className="text-xs font-mono text-error">{error}</p>
          </div>
        )}

        <TVGrid products={products} />
      </div>
    </main>
  );
}
