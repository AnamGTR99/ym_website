import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;

  return (
    <>
      <WalkthroughNav current="/tv/example-product" />
      <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Link
              href="/tv"
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors"
            >
              ← Back to TV
            </Link>
            <span className="text-xs font-mono text-zinc-700">|</span>
            <span className="text-xs font-mono text-zinc-500">
              Handle: {handle}
            </span>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-widest">
            Single Channel — Product Page
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left column — Media */}
            <div className="flex flex-col gap-4">
              <PlaceholderSection
                label="Product Image"
                asset="From Shopify CDN"
                dimensions="Square or 4:3 · Responsive"
                behavior="Primary product photo · Swipeable gallery"
                className="aspect-square"
              />

              <PlaceholderSection
                label="3D Model Viewer"
                asset="GLB — from Shopify metafield"
                dimensions="Same container as image · Toggle between photo/3D"
                behavior="<model-viewer> · Rotate, zoom, pan · Auto-rotate idle"
              />
            </div>

            {/* Right column — Info + Actions */}
            <div className="flex flex-col gap-4">
              <PlaceholderSection
                label="Product Title & Price"
                behavior="Title from Shopify · Price with currency · Compare-at price if on sale"
              />

              <PlaceholderSection
                label="Variant Selector"
                behavior="Size, color, etc. from Shopify options · Updates price and image on selection"
              />

              <PlaceholderSection
                label="Add to Cart Button"
                behavior="Adds selected variant to Shopify cart · Shows cart overlay on success"
                className="min-h-[80px]"
              >
                <button className="mt-3 px-6 py-3 bg-white text-black text-sm font-mono uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors">
                  Add to Cart
                </button>
              </PlaceholderSection>

              <PlaceholderSection
                label="Product Description"
                behavior="Rich HTML from Shopify descriptionHtml · Below the fold"
              />
            </div>
          </div>

          {/* Music player zone */}
          <PlaceholderSection
            label="Track Player — Linked Music"
            asset="Audio from Supabase Storage (signed URL)"
            behavior="Tracks linked via track_product_map · Play/pause/seek · Persistent GlobalAudioPlayer"
            className="w-full"
          />
        </div>
      </main>
    </>
  );
}
