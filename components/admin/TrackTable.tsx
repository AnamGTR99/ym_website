"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/supabase/tracks";
import { toggleTrackPublished, deleteTrack } from "@/app/admin/tracks/actions";

type AccessFilter = "all" | Track["access_type"];
type PublishFilter = "all" | "published" | "unpublished";

export default function TrackTable({
  tracks,
  trackProducts,
}: {
  tracks: Track[];
  trackProducts: Record<string, string[]>;
}) {
  const router = useRouter();
  const [accessFilter, setAccessFilter] = useState<AccessFilter>("all");
  const [publishFilter, setPublishFilter] = useState<PublishFilter>("all");
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

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

  const handleDelete = (trackId: string) => {
    startTransition(async () => {
      await deleteTrack(trackId);
      setConfirmDelete(null);
      router.refresh();
    });
  };

  return (
    <div>
      {/* Filters */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Status
          </label>
          <select
            value={publishFilter}
            onChange={(e) => setPublishFilter(e.target.value as PublishFilter)}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:border-amber-600 focus:outline-none transition-colors"
          >
            <option value="all">All</option>
            <option value="published">Published</option>
            <option value="unpublished">Draft</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-xs font-mono text-zinc-500 uppercase tracking-wider">
            Access
          </label>
          <select
            value={accessFilter}
            onChange={(e) => setAccessFilter(e.target.value as AccessFilter)}
            className="bg-zinc-900 border border-zinc-700 rounded-md px-3 py-1.5 text-sm text-zinc-300 focus:border-amber-600 focus:outline-none transition-colors"
          >
            <option value="all">All</option>
            <option value="public">Public</option>
            <option value="one_off">One-off</option>
          </select>
        </div>
        <p className="text-xs text-zinc-600 font-mono ml-auto">
          {filtered.length} / {tracks.length} tracks
        </p>
      </div>

      {/* Table */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="text-left px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Track
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Linked Products
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Files
              </th>
              <th className="text-left px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Status
              </th>
              <th className="text-right px-4 py-3 text-[10px] font-mono text-zinc-500 uppercase tracking-widest">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-12 text-center text-zinc-600">
                  No tracks found
                </td>
              </tr>
            ) : (
              filtered.map((track) => {
                const products = trackProducts[track.id] ?? [];
                const hasAudio = track.audio_path && track.audio_path !== "pending";
                const hasPreview = !!track.preview_path;
                const hasCover = !!track.cover_url;

                return (
                  <tr
                    key={track.id}
                    onClick={() => router.push(`/admin/tracks/${track.id}`)}
                    className="border-b border-zinc-800/40 hover:bg-zinc-800/30 cursor-pointer transition-colors group"
                  >
                    {/* Track info */}
                    <td className="px-4 py-3">
                      <div className="font-medium text-zinc-100 group-hover:text-amber-400 transition-colors">
                        {track.title}
                      </div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {track.artist}
                        <span className="mx-1.5 text-zinc-700">|</span>
                        <span className={track.access_type === "public" ? "text-teal-500" : "text-amber-600"}>
                          {track.access_type === "public" ? "Public" : "One-off"}
                        </span>
                        <span className="mx-1.5 text-zinc-700">|</span>
                        <span>{new Date(track.created_at).toLocaleDateString()}</span>
                      </div>
                    </td>

                    {/* Linked products */}
                    <td className="px-4 py-3">
                      {products.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {products.map((name) => (
                            <span
                              key={name}
                              className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-400 border border-zinc-700"
                            >
                              {name}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-700 italic">
                          No products linked
                        </span>
                      )}
                    </td>

                    {/* File status */}
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            hasAudio
                              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                              : "bg-red-900/20 text-red-500 border border-red-800/30"
                          }`}
                          title={hasAudio ? "Audio uploaded" : "No audio"}
                        >
                          Audio {hasAudio ? "OK" : "--"}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            hasCover
                              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                              : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                          title={hasCover ? "Cover uploaded" : "No cover"}
                        >
                          Cover {hasCover ? "OK" : "--"}
                        </span>
                        <span
                          className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                            hasPreview
                              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                              : "bg-zinc-800 text-zinc-600 border border-zinc-700"
                          }`}
                          title={hasPreview ? "Preview uploaded" : "No preview"}
                        >
                          Clip {hasPreview ? "OK" : "--"}
                        </span>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={`text-xs font-mono px-2.5 py-1 rounded-full ${
                          track.published
                            ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
                            : "bg-zinc-800 text-zinc-500 border border-zinc-700"
                        }`}
                      >
                        {track.published ? "Live" : "Draft"}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggle(track.id, track.published);
                          }}
                          disabled={pending}
                          className={`text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50 ${
                            track.published
                              ? "text-zinc-400 hover:text-amber-400 hover:bg-zinc-800"
                              : "text-emerald-500 hover:text-emerald-400 hover:bg-emerald-900/20"
                          }`}
                        >
                          {track.published ? "Unpublish" : "Publish"}
                        </button>
                        {confirmDelete === track.id ? (
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDelete(track.id);
                              }}
                              disabled={pending}
                              className="text-xs px-2 py-1 rounded bg-red-900/40 text-red-400 hover:bg-red-900/60 transition-colors disabled:opacity-50"
                            >
                              Confirm
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setConfirmDelete(null);
                              }}
                              className="text-xs px-2 py-1 rounded text-zinc-500 hover:text-zinc-300 transition-colors"
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setConfirmDelete(track.id);
                            }}
                            className="text-xs px-2.5 py-1 rounded text-zinc-600 hover:text-red-400 hover:bg-red-900/20 transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
