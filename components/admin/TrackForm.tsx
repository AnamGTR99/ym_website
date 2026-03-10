"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { Track } from "@/lib/supabase/tracks";
import {
  createTrack,
  updateTrack,
  type TrackFormData,
} from "@/app/admin/tracks/actions";
import ProductSelector from "./ProductSelector";

interface TrackFormProps {
  track?: Track;
  linkedProductIds?: string[];
}

export default function TrackForm({ track, linkedProductIds }: TrackFormProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState(track?.title ?? "");
  const [artist, setArtist] = useState(track?.artist ?? "Yunmakai");
  const [description, setDescription] = useState(track?.description ?? "");
  const [releaseDate, setReleaseDate] = useState(track?.release_date ?? "");
  const [accessType, setAccessType] = useState<Track["access_type"]>(
    track?.access_type ?? "public"
  );
  const [published, setPublished] = useState(track?.published ?? false);
  const [durationSeconds, setDurationSeconds] = useState(
    track?.duration_seconds?.toString() ?? ""
  );
  const [productIds, setProductIds] = useState<string[]>(
    linkedProductIds ?? []
  );

  const isEdit = !!track;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Title is required");
      return;
    }
    if (!artist.trim()) {
      setError("Artist is required");
      return;
    }

    const data: TrackFormData = {
      title: title.trim(),
      artist: artist.trim(),
      description: description.trim(),
      release_date: releaseDate,
      access_type: accessType,
      published,
      duration_seconds: durationSeconds ? parseInt(durationSeconds, 10) : null,
      audio_path: track?.audio_path ?? "pending",
      cover_url: track?.cover_url ?? "",
      product_ids: productIds,
    };

    startTransition(async () => {
      try {
        if (isEdit) {
          await updateTrack(track.id, data);
        } else {
          await createTrack(data);
        }
        router.push("/admin/tracks");
        router.refresh();
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to save track"
        );
      }
    });
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
      {error && (
        <div className="bg-red-900/20 border border-red-800 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Title */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Artist */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
          Artist *
        </label>
        <input
          type="text"
          value={artist}
          onChange={(e) => setArtist(e.target.value)}
          required
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Description */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm resize-y focus:border-zinc-500 focus:outline-none"
        />
      </div>

      {/* Release date + Duration row */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            Release Date
          </label>
          <input
            type="date"
            value={releaseDate}
            onChange={(e) => setReleaseDate(e.target.value)}
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
            Duration (seconds)
          </label>
          <input
            type="number"
            value={durationSeconds}
            onChange={(e) => setDurationSeconds(e.target.value)}
            min="0"
            placeholder="Auto-detected on upload"
            className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
          />
        </div>
      </div>

      {/* Access type */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
          Access Type
        </label>
        <select
          value={accessType}
          onChange={(e) =>
            setAccessType(e.target.value as Track["access_type"])
          }
          className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm focus:border-zinc-500 focus:outline-none"
        >
          <option value="public">Public</option>
          <option value="subscriber">Subscriber</option>
          <option value="one_off">One-off Purchase</option>
          <option value="hybrid">Hybrid</option>
        </select>
      </div>

      {/* Published toggle */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setPublished(!published)}
          className={`relative w-10 h-5 rounded-full transition-colors ${
            published ? "bg-emerald-600" : "bg-zinc-700"
          }`}
        >
          <span
            className={`absolute top-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
              published ? "left-5" : "left-0.5"
            }`}
          />
        </button>
        <span className="text-sm text-zinc-400">
          {published ? "Published" : "Draft"}
        </span>
      </div>

      {/* Product associations */}
      <div>
        <label className="block text-xs font-mono text-zinc-500 uppercase tracking-wider mb-1">
          Linked Shopify Products
        </label>
        <ProductSelector selectedIds={productIds} onChange={setProductIds} />
      </div>

      {/* File upload info */}
      {!isEdit && (
        <p className="text-xs text-zinc-600">
          Audio and cover image uploads are handled after creating the track.
        </p>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={pending}
          className="px-5 py-2 bg-white text-black hover:bg-zinc-200 rounded text-sm transition-colors disabled:opacity-50"
        >
          {pending
            ? "Saving..."
            : isEdit
              ? "Update Track"
              : "Create Track"}
        </button>
        <button
          type="button"
          onClick={() => router.push("/admin/tracks")}
          className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
