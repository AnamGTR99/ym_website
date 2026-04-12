import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/supabase/tracks";
import TrackForm from "@/components/admin/TrackForm";
import TrackUploads from "@/components/admin/TrackUploads";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireAdmin();
  const { id } = await params;
  const supabase = createAdminClient();

  const [trackResult, mappingsResult, productsResult] = await Promise.all([
    supabase.from("tracks").select("*").eq("id", id).single(),
    supabase.from("track_product_map").select("shopify_product_id").eq("track_id", id),
    supabase.from("product_cache").select("shopify_id, title, handle, image_url").order("title"),
  ]);

  if (!trackResult.data) notFound();

  const linkedProductIds = (mappingsResult.data ?? []).map(
    (m) => m.shopify_product_id
  );

  const shopifyProducts = (productsResult.data ?? []).map((p) => ({
    id: p.shopify_id,
    title: p.title,
    handle: p.handle,
    image: p.image_url,
  }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Track</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <TrackForm
          track={trackResult.data as Track}
          linkedProductIds={linkedProductIds}
          shopifyProducts={shopifyProducts}
        />
        <TrackUploads track={trackResult.data as Track} />
      </div>
    </div>
  );
}
