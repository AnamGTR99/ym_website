"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/supabase/tracks";
import { toggleTrackPublished } from "@/app/admin/tracks/actions";

type AccessFilter = "all" | Track["access_type"];
type PublishFilter = "all" | "published" | "unpublished";

export default function TrackTable({ tracks }: { tracks: Track[] }) {
  const router = useRouter();
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [pending, startTransition] = useTransition();

  const filtered = tracks.filter((t) => {
    if (accessFilter !== "all" && t.access_type !== accessFilter) return false;
    if (publishFilter === "published" && !t.published) return false;
    if (publishFilter === "unpublished" && t.published) return false;
    return true;
  });

  const handleToggle = (trackId: string, currentlyPublished: boolean) => {
    startTransition(async () => {
      await toggleTrackPublished(trackId, !currentlyPublished);
      router.refresh();
    });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500 uppercase">
            Status
          </label>
          <select
            value={publishFilter}
            onChange={(e) =>
              setPublishFilter(e.target.value as PublishFilter)
            }
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Unpublished</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500 uppercase">
            Access
          </label>
          <select
            value={accessFilter}
            onChange={(e) =>
              setAccessFilter(e.target.value as AccessFilter)
            }
            className="bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-sm"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="subscriber">Subscriber</option>
            <option value="one_off">One-off</option>
            <option value="hybrid">Hybrid</option>
          </select>
        </div>
        <p className="text-xs text-zinc-600 ml-auto self-center">
          {filtered.length} track{filtered.length !== 1 ? "s" : ""}
        </p>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Title
              </th>
              <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Artist
              </th>
              <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Access
              </th>
              <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left px-4 py-3 text-xs font-mono text-zinc-500 uppercase tracking-wider">
                Created
              </th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-zinc-600"
                >
                  No tracks found
                </td>
              </tr>
            ) : (
              filtered.map((track) => (
                <tr
                  key={track.id}
                  onClick={() =>
                    router.push(`/admin/tracks/${track.id}`)
                  }
                  className="border-b border-zinc-800/50 hover:bg-zinc-900/50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium">{track.title}</td>
                  <td className="px-4 py-3 text-zinc-400">{track.artist}</td>
                  <td className="px-4 py-3">
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                      {track.access_type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded ${
                        track.published
                          ? "bg-emerald-900/30 text-emerald-400"
                          : "bg-zinc-800 text-zinc-500"
                      }`}
                    >
                      {track.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-500 text-xs">
                    {new Date(track.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleToggle(track.id, track.published);
                      }}
                      disabled={pending}
                      className="text-xs text-zinc-500 hover:text-white transition-colors disabled:opacity-50"
                    >
                      {track.published ? "Unpublish" : "Publish"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
