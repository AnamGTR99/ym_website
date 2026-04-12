import { createAdminClient } from "@/lib/supabase/server";
import TrackForm from "@/components/admin/TrackForm";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function NewTrackPage() {
  await requireAdmin();

  const supabase = createAdminClient();
  const { data: products } = await supabase
    .from("product_cache")
    .select("shopify_id, title, handle, image_url")
    .order("title");

  const shopifyProducts = (products ?? []).map((p) => ({
    id: p.shopify_id,
    title: p.title,
    handle: p.handle,
    image: p.image_url,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Add Track</h1>
      <TrackForm shopifyProducts={shopifyProducts} />
    </div>
  );
}
