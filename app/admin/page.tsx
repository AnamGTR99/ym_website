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
    { count: cachedProducts },
  ] = await Promise.all([
    supabase.from("tracks").select("*", { count: "exact", head: true }),
    supabase.from("tracks").select("*", { count: "exact", head: true }).eq("published", true),
    supabase.from("product_cache").select("*", { count: "exact", head: true }),
  ]);

  const stats = [
    { label: "Total Tracks", value: totalTracks ?? 0 },
    { label: "Published", value: publishedTracks ?? 0 },
    { label: "Shopify Products", value: cachedProducts ?? 0 },
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
      <div className="flex flex-wrap gap-3 mb-6">
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

      {/* Shopify sync */}
      <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider mb-3">
        Shopify
      </h2>
      <SyncProductsButton />
      <p className="text-xs text-zinc-600 mt-2">
        Pull latest products from your Shopify store into the local cache.
        Run this after adding new products in Shopify admin.
      </p>
    </div>
  );
}
