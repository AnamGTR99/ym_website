import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import type { Track } from "@/lib/supabase/tracks";
import TrackTable from "@/components/admin/TrackTable";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminTracksPage() {
  await requireAdmin();
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .from("tracks")
    .select("*")
    .order("created_at", { ascending: false });

  const tracks: Track[] = error ? [] : (data as Track[]);

  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tracks</h1>
        <Link
          href="/admin/tracks/new"
          className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded text-sm transition-colors"
        >
          Add Track
        </Link>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-4 mb-4">
          <p className="text-sm text-red-400">
            Failed to load tracks: {error.message}
          </p>
        </div>
      )}

      <TrackTable tracks={tracks} />
    </div>
  );
}
