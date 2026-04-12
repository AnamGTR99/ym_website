import TrackForm from "@/components/admin/TrackForm";
import { requireAdmin } from "@/lib/auth/require-admin";
import { getProducts } from "@/lib/shopify/products";

export default async function NewTrackPage() {
  await requireAdmin();

  const shopifyResult = await getProducts({ first: 50, sortKey: "TITLE" }).catch(() => ({ products: [] }));

  const shopifyProducts = shopifyResult.products.map((p) => ({
    id: p.id,
    title: p.title,
    handle: p.handle,
    image: p.featuredImage?.url ?? null,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add Track</h1>
      <TrackForm shopifyProducts={shopifyProducts} />
    </div>
  );
}
