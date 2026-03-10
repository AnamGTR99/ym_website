import { notFound } from "next/navigation";
import Link from "next/link";
import WalkthroughNav from "@/components/ui/WalkthroughNav";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import ProductScreen from "@/components/tv/ProductScreen";
import ProductControls from "@/components/tv/ProductControls";
import { getProductByHandle } from "@/lib/shopify/products";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) notFound();

  return (
    <>
      <WalkthroughNav current={`/tv/${handle}`} />
      <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          {/* Breadcrumb */}
          <div className="flex items-center gap-3">
            <Link
              href="/tv"
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors"
            >
              ← Back to TV
            </Link>
            <span className="text-xs font-mono text-zinc-700">|</span>
            <span className="text-xs font-mono text-zinc-500">
              {product.title}
            </span>
          </div>

          {/* Retro TV Unit: Screen left, Controls right */}
          <div className="flex flex-col md:flex-row w-full border border-zinc-800 rounded-xl overflow-hidden">
            <ProductScreen
              images={product.images}
              title={product.title}
              glbUrl={product.glbUrl}
            />
            <ProductControls product={product} />
          </div>

          {/* Track Player — Below TV unit (placeholder until music streaming) */}
          <PlaceholderSection
            label="Track Player — Linked Music"
            asset="Audio from Supabase Storage (signed URL)"
            behavior="Tracks linked via track_product_map · Persistent GlobalAudioPlayer"
            className="w-full"
          />
        </div>
      </main>
    </>
  );
}
