import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/supabase/tracks";
import TrackForm from "@/components/admin/TrackForm";
import TrackUploads from "@/components/admin/TrackUploads";

export default async function EditTrackPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = createAdminClient();

  const { data: track } = await supabase
    .from("tracks")
    .select("*")
    .eq("id", id)
    .single();

  if (!track) notFound();

  // Fetch linked product IDs
  const { data: mappings } = await supabase
    .from("track_product_map")
    .select("shopify_product_id")
    .eq("track_id", id);

  const linkedProductIds = (mappings ?? []).map(
    (m) => m.shopify_product_id
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Edit Track</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
        <TrackForm
          track={track as Track}
          linkedProductIds={linkedProductIds}
        />
        <TrackUploads track={track as Track} />
      </div>
    </div>
  );
}
