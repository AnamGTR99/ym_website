import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getProductByHandle } from "@/lib/shopify/products";
import { formatPrice } from "@/lib/shopify/utils";

export const revalidate = 60;

// The product detail view lives inside the CRT in the motel room. This
// route only exists so direct product links (email, SEO) still resolve:
// it keeps the Shopify metadata for preview cards and then bounces the
// user into /room?tv=1&product=<handle> so the TV auto-opens the detail.
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

export default async function ProductRedirect({
  params,
}: {
  params: Promise<{ handle: string }>;
}) {
  const { handle } = await params;
  redirect(`/room?tv=1&product=${encodeURIComponent(handle)}`);
}
