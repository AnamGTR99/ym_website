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
            Single Channel — Retro TV Product Page
          </h1>

          {/* Retro TV Unit: Screen left, Controls right */}
          <div className="flex flex-col md:flex-row w-full border border-zinc-800 rounded-xl overflow-hidden">
            {/* TV Screen — Product Image / 3D Model */}
            <PlaceholderSection
              label="Product Image / 3D Model"
              asset="Shopify CDN image or GLB via <model-viewer>"
              dimensions="Fills TV screen area"
              behavior="Photo/3D toggle · Gallery swipe · 3D rotate/zoom/pan"
              className="flex-1 min-h-[400px] md:min-h-[500px] rounded-none border-0"
            >
              <div className="flex gap-2 mt-4">
                <span className="px-3 py-1 text-xs font-mono border border-zinc-600 rounded text-zinc-400">
                  Photo
                </span>
                <span className="px-3 py-1 text-xs font-mono border border-purple-500 rounded text-purple-400">
                  3D
                </span>
              </div>
            </PlaceholderSection>

            {/* TV Controls Panel — Right side */}
            <div className="w-full md:w-72 flex-shrink-0 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col gap-5">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Channel
                </p>
                <h2 className="text-lg font-bold text-white mt-1">
                  Product Title
                </h2>
                <p className="text-sm text-zinc-400">$XX.XX USD</p>
              </div>

              <hr className="border-zinc-800" />

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Variant
                </p>
                <div className="flex gap-2 mt-2">
                  <span className="px-3 py-1.5 text-xs font-mono border border-zinc-700 rounded text-zinc-500">
                    S
                  </span>
                  <span className="px-3 py-1.5 text-xs font-mono border border-white rounded text-white">
                    M
                  </span>
                  <span className="px-3 py-1.5 text-xs font-mono border border-zinc-700 rounded text-zinc-500">
                    L
                  </span>
                </div>
              </div>

              <hr className="border-zinc-800" />

              <button className="w-full py-3 bg-white text-black text-sm font-mono uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors">
                Add to Cart
              </button>

              <hr className="border-zinc-800" />

              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Description
                </p>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Product details from Shopify descriptionHtml
                </p>
              </div>
            </div>
          </div>

          {/* Track Player — Below TV unit */}
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
