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
      <div className="relative aspect-square border border-ash rounded overflow-hidden bg-charcoal transition-all duration-300 group-hover:border-amber group-hover:shadow-[0_0_16px_rgba(212,168,83,0.12)]">
        {/* Channel number badge */}
        <span className="absolute top-1.5 left-1.5 z-10 text-[10px] font-mono text-fog bg-void/80 px-1.5 py-0.5 rounded group-hover:text-amber group-hover:bg-void/90 transition-colors">
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
            <span className="text-2xl font-bold text-ash font-mono">
              {String(channelNumber).padStart(2, "0")}
            </span>
          </div>
        )}

        {/* Overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-void/90 via-void/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />

        {/* Bottom info */}
        <div className="absolute bottom-0 left-0 right-0 p-2 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-200">
          <p className="text-xs font-mono text-bone truncate leading-tight">
            {product.title}
          </p>
          <p className="text-[10px] font-mono text-amber mt-0.5">
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
