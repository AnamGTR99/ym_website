export const dynamic = "force-dynamic";

import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";
import SyncProductsButton from "@/components/admin/SyncProductsButton";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = createAdminClient();

  const [
    { count: totalTracks },
    { count: publishedTracks },
    { count: draftTracks },
    { data: recentTracks },
    { count: cachedProducts },
  ] = await Promise.all([
    supabase.from("tracks").select("*", { count: "exact", head: true }),
    supabase.from("tracks").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("tracks").select("*", { count: "exact", head: true }).eq("published", false),
    supabase
      .from("tracks")
      .select("id, title, artist, published, audio_path, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    supabase.from("product_cache").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Tracks", value: totalTracks ?? 0, color: "text-zinc-100" },
    { label: "Published", value: publishedTracks ?? 0, color: "text-emerald-400" },
    { label: "Drafts", value: draftTracks ?? 0, color: "text-zinc-500" },
    { label: "Shopify Products", value: cachedProducts ?? 0, color: "text-amber-400" },
  ];

  return (
    <div className="max-w-5xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-sm text-zinc-500 mt-1">
          Overview of your music catalog and store
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900/50 border border-zinc-800/60 rounded-lg p-5"
          >
            <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-[0.2em]">
              {stat.label}
            </p>
            <p className={`text-3xl font-bold mt-2 ${stat.color}`}>
              {stat.value}
            </p>
          </div>
        ))}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-5 gap-6">
        {/* Recent tracks */}
        <div className="col-span-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
              Recent Tracks
            </h2>
            <Link
              href="/admin/tracks"
              className="text-xs text-amber-600 hover:text-amber-400 transition-colors"
            >
              View All →
            </Link>
          </div>
          <div className="border border-zinc-800/60 rounded-lg overflow-hidden">
            {(recentTracks ?? []).length === 0 ? (
              <div className="px-4 py-8 text-center text-zinc-600 text-sm">
                No tracks yet
              </div>
            ) : (
              (recentTracks ?? []).map(
                (track: {
                  id: string;
                  title: string;
                  artist: string;
                  published: boolean;
                  audio_path: string;
                  created_at: string;
                }) => (
                  <Link
                    key={track.id}
                    href={`/admin/tracks/${track.id}`}
                    className="flex items-center justify-between px-4 py-3 border-b border-zinc-800/40 hover:bg-zinc-800/30 transition-colors last:border-b-0"
                  >
                    <div>
                      <div className="text-sm font-medium text-zinc-200">
                        {track.title}
                      </div>
                      <div className="text-xs text-zinc-600 mt-0.5">
                        {track.artist} · {new Date(track.created_at).toLocaleDateString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {track.audio_path && track.audio_path !== "pending" ? (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-emerald-900/30 text-emerald-500 border border-emerald-800/40">
                          Audio OK
                        </span>
                      ) : (
                        <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-red-900/20 text-red-500 border border-red-800/30">
                          No Audio
                        </span>
                      )}
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded-full ${
                          track.published
                            ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/40"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}
                      >
                        {track.published ? "Live" : "Draft"}
                      </span>
                    </div>
                  </Link>
                )
              )
            )}
          </div>
        </div>

        {/* Quick actions + Shopify */}
        <div className="col-span-2 space-y-6">
          <div>
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">
              Quick Actions
            </h2>
            <div className="flex flex-col gap-2">
              <Link
                href="/admin/tracks"
                className="px-4 py-2.5 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/40 rounded-md text-sm transition-colors text-zinc-300 hover:text-zinc-100"
              >
                ♫ Manage Tracks
              </Link>
              <Link
                href="/admin/tracks/new"
                className="px-4 py-2.5 bg-amber-600 hover:bg-amber-500 text-black font-medium rounded-md text-sm transition-colors"
              >
                + Add New Track
              </Link>
            </div>
          </div>

          <div>
            <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em] mb-4">
              Shopify Sync
            </h2>
            <SyncProductsButton />
            <p className="text-[11px] text-zinc-600 mt-3 leading-relaxed">
              Pull latest products from your Shopify store.
              Run after adding or updating products.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
