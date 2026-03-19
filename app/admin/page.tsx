import Link from "next/link";
import { createAdminClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth/require-admin";

export default async function AdminDashboard() {
  await requireAdmin();
  const supabase = createAdminClient();

  // Fetch track stats
  const { count: totalTracks } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true });

  const { count: publishedTracks } = await supabase
    .from("tracks")
    .select("*", { count: "exact", head: true })
    .eq("published", true);

  const stats = [
    { label: "Total Tracks", value: totalTracks ?? 0 },
    { label: "Published", value: publishedTracks ?? 0 },
    {
      label: "Unpublished",
      value: (totalTracks ?? 0) - (publishedTracks ?? 0),
    },
  ];

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="bg-zinc-900 border border-zinc-800 rounded-lg p-4"
          >
            <p className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
              {stat.label}
            </p>
            <p className="text-3xl font-bold mt-1">{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-3">
        Quick Actions
      </h2>
      <div className="flex gap-3">
        <Link
          href="/admin/tracks"
          className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
        >
          Manage Tracks
        </Link>
        <Link
          href="/admin/tracks/new"
          className="px-4 py-2 bg-white text-black hover:bg-zinc-200 rounded text-sm transition-colors"
        >
          Add Track
        </Link>
      </div>
    </div>
  );
}
