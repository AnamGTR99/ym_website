import { notFound } from "next/navigation";
import Link from "next/link";
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

  const track = trackResult.data as Track;

  const linkedProductIds = (mappingsResult.data ?? []).map(
    (m) => m.shopify_product_id
  );

  const shopifyProducts = (productsResult.data ?? []).map((p) => ({
    id: p.shopify_id,
    title: p.title,
    handle: p.handle,
    image: p.image_url,
  }));

  // Resolve linked product names for the header summary
  const linkedProductNames = linkedProductIds
    .map((pid) => shopifyProducts.find((p) => p.id === pid)?.title)
    .filter(Boolean);

  const hasAudio = track.audio_path && track.audio_path !== "pending";
  const hasPreview = !!track.preview_path;
  const hasCover = !!track.cover_url;

  return (
    <div className="max-w-6xl">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-zinc-600 mb-4">
        <Link href="/admin/tracks" className="hover:text-zinc-400 transition-colors">
          Tracks
        </Link>
        <span>/</span>
        <span className="text-zinc-400">{track.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{track.title}</h1>
          <div className="flex items-center gap-3 mt-2">
            <span className="text-sm text-zinc-500">{track.artist}</span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded-full ${
                track.published
                  ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                  : "bg-zinc-800 text-zinc-500 border border-zinc-700"
              }`}
            >
              {track.published ? "Live" : "Draft"}
            </span>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                track.access_type === "public"
                  ? "text-teal-500 bg-teal-900/20 border border-teal-800/30"
                  : "text-amber-500 bg-amber-900/20 border border-amber-800/30"
              }`}
            >
              {track.access_type === "public" ? "Public" : "One-off"}
            </span>
          </div>
          {linkedProductNames.length > 0 && (
            <div className="flex items-center gap-2 mt-3">
              <span className="text-[10px] font-mono text-zinc-600 uppercase tracking-wider">
                Linked to:
              </span>
              {linkedProductNames.map((name) => (
                <span
                  key={name}
                  className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* File status summary */}
        <div className="flex gap-2">
          <div
            className={`text-[10px] font-mono px-2.5 py-1.5 rounded ${
              hasAudio
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                : "bg-red-900/20 text-red-400 border border-red-800/30"
            }`}
          >
            Audio {hasAudio ? "✓" : "✗"}
          </div>
          <div
            className={`text-[10px] font-mono px-2.5 py-1.5 rounded ${
              hasCover
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                : "bg-zinc-800 text-zinc-600 border border-zinc-700"
            }`}
          >
            Cover {hasCover ? "✓" : "—"}
          </div>
          <div
            className={`text-[10px] font-mono px-2.5 py-1.5 rounded ${
              hasPreview
                ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                : "bg-zinc-800 text-zinc-600 border border-zinc-700"
            }`}
          >
            Preview {hasPreview ? "✓" : "—"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <TrackForm
          track={track}
          linkedProductIds={linkedProductIds}
          shopifyProducts={shopifyProducts}
        />
        <TrackUploads track={track} />
      </div>
    </div>
  );
}
