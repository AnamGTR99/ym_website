import WalkthroughNav from "@/components/ui/WalkthroughNav";
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
    <>
      <WalkthroughNav current="/tv" />
      <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-center">
            TV Catalogue — Channel Grid
          </h1>

          {error && (
            <div className="border border-red-400/30 bg-red-400/5 rounded-lg px-4 py-3">
              <p className="text-xs font-mono text-red-400">{error}</p>
            </div>
          )}

          <TVGrid products={products} />
        </div>
      </main>
    </>
  );
}
