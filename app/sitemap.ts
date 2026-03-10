import type { MetadataRoute } from "next";
import { getProducts } from "@/lib/shopify/products";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://ym-website-theta.vercel.app";

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: `${baseUrl}/tv`, lastModified: new Date(), changeFrequency: "daily", priority: 0.9 },
    { url: `${baseUrl}/room`, lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
  ];

  // Dynamic product pages from Shopify
  let productPages: MetadataRoute.Sitemap = [];
  try {
    const { products } = await getProducts({ first: 100 });
    productPages = products.map((p) => ({
      url: `${baseUrl}/tv/${p.handle}`,
      lastModified: new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }));
  } catch {
    // Shopify unavailable — return static pages only
  }

  return [...staticPages, ...productPages];
}
