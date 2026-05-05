import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/supabase/tracks";
import TrackTable from "@/components/admin/TrackTable";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminTracksPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [{ data, error }, { data: mappings }, { data: products }] =
    await Promise.all([
      supabase.from("tracks").select("*").order("created_at", { ascending: false }),
      supabase.from("track_product_map").select("track_id, shopify_product_id"),
      supabase.from("product_cache").select("shopify_id, title"),
    ]);

  const tracks: Track[] = error ? [] : (data as Track[]);

  // Build a map of track_id -> product names
  const productNameMap = new Map(
    (products ?? []).map((p: { shopify_id: string; title: string }) => [p.shopify_id, p.title])
  );

  const trackProducts: Record<string, string[]> = {};
  for (const m of mappings ?? []) {
    const row = m as { track_id: string; shopify_product_id: string };
    if (!trackProducts[row.track_id]) trackProducts[row.track_id] = [];
    const name = productNameMap.get(row.shopify_product_id);
    if (name) trackProducts[row.track_id].push(name);
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tracks</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Manage your music catalog
          </p>
        </div>
        <Link
          href="/admin/tracks/new"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 text-black font-medium rounded-md text-sm transition-colors"
        >
          + Add Track
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-400">
            Failed to load tracks: {error.message}
          </p>
        </div>
      )}

      <TrackTable tracks={tracks} trackProducts={trackProducts} />
    </div>
  );
}
