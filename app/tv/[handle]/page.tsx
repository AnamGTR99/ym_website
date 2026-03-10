import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import WalkthroughNav from "@/components/ui/WalkthroughNav";
import ProductScreen from "@/components/tv/ProductScreen";
import ProductControls from "@/components/tv/ProductControls";
import TrackList from "@/components/music/TrackList";
import { getProductByHandle } from "@/lib/shopify/products";
import { getTracksByProductId } from "@/lib/supabase/tracks";
import { formatPrice } from "@/lib/shopify/utils";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ handle: string }>;
}): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) {
    return { title: "Product Not Found" };
  }

  const price = formatPrice(
    product.priceRange.minVariantPrice.amount,
    product.priceRange.minVariantPrice.currencyCode
  );

  const title = product.seo.title ?? product.title;
  const description =
    product.seo.description ??
    product.description ??
    `${product.title} — ${price}`;

  return {
    title: `${title} | Yunmakai`,
    description,
    openGraph: {
      title,
      description,
      type: "website",
      images: product.images[0]
        ? [
            {
              url: product.images[0].url,
              width: product.images[0].width ?? undefined,
              height: product.images[0].height ?? undefined,
              alt: product.images[0].altText ?? product.title,
            },
          ]
        : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: product.images[0]?.url ? [product.images[0].url] : undefined,
    },
  };
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);

  if (!product) notFound();

  // Fetch linked tracks (runs in parallel with product data on cache hit)
  const tracks = await getTracksByProductId(product.id);

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

          {/* Linked tracks — only rendered when tracks exist */}
          <TrackList tracks={tracks} />
        </div>
      </main>
    </>
  );
}
