import Image from "next/image";
import Link from "next/link";
import { formatPrice } from "@/lib/shopify/utils";
import type { ShopifyProduct } from "@/lib/shopify/types";

interface TVCardProps {
  product: ShopifyProduct;
  channelNumber: number;
}

export default function TVCard({ product, channelNumber }: TVCardProps) {
  return (
    <Link href={`/tv/${product.handle}`} className="group block">
      <div className="relative aspect-square border border-zinc-700 rounded overflow-hidden bg-zinc-900 transition-all duration-200 group-hover:border-white group-hover:shadow-[0_0_12px_rgba(255,255,255,0.08)]">
        {/* Channel number badge */}
        <span className="absolute top-1.5 left-1.5 z-10 text-[10px] font-mono text-zinc-500 bg-zinc-950/80 px-1.5 py-0.5 rounded group-hover:text-white group-hover:bg-zinc-900/90 transition-colors">
          {String(channelNumber).padStart(2, "0")}
        </span>

        {/* Product image */}
        {product.featuredImage ? (
          <Image
            src={product.featuredImage.url}
            alt={product.featuredImage.altText ?? product.title}
            fill
            sizes="(max-width: 768px) 33vw, 160px"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-2xl font-bold text-zinc-700">
              {String(channelNumber).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-xs font-mono text-white truncate leading-tight">
            {product.title}
          </p>
          <p className="text-[10px] font-mono text-zinc-400 mt-0.5">
            {formatPrice(
              product.priceRange.minVariantPrice.amount,
              product.priceRange.minVariantPrice.currencyCode
            )}
          </p>
        </div>
      </div>
    </Link>
  );
}
