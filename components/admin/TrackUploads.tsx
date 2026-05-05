"use client";

import { useRouter } from "next/navigation";
import type { Track } from "@/lib/supabase/tracks";
import UploadField from "./UploadField";

export default function TrackUploads({ track }: { track: Track }) {
  const router = useRouter();

  const hasAudio = track.audio_path && track.audio_path !== "pending";
  const hasPreview = !!track.preview_path;
  const hasCover = !!track.cover_url;

  return (
    <div className="space-y-6">
      <h2 className="text-xs font-mono text-zinc-500 uppercase tracking-[0.2em]">
        File Uploads
      </h2>

      {/* Audio */}
      <div className="border border-zinc-800/60 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Audio File
          </span>
          {hasAudio ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">
              ✓ Uploaded
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-red-900/20 text-red-400 border border-red-800/30">
              ✗ Required
            </span>
          )}
        </div>
        {hasAudio && (
          <div className="mb-3 px-3 py-2 bg-zinc-900/60 rounded border border-zinc-800/40">
            <p className="text-xs text-zinc-400 font-mono truncate">
              {track.audio_path}
            </p>
            {track.duration_seconds && (
              <p className="text-[10px] text-zinc-600 mt-1">
                Duration: {Math.floor(track.duration_seconds / 60)}:{String(track.duration_seconds % 60).padStart(2, "0")}
              </p>
            )}
          </div>
        )}
        <UploadField
          label={hasAudio ? "Replace Audio" : "Upload Audio"}
          accept="audio/mpeg,audio/aac,audio/mp4,audio/wav"
          maxSizeMB={50}
          uploadUrl="/api/admin/tracks/upload-audio"
          trackId={track.id}
          currentValue={null}
          onUploaded={() => router.refresh()}
        />
      </div>

      {/* Preview Clip */}
      <div className="border border-zinc-800/60 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Preview Clip
          </span>
          {hasPreview ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">
              ✓ Uploaded
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-600 border border-zinc-700">
              Optional
            </span>
          )}
        </div>
        {hasPreview && (
          <div className="mb-3 px-3 py-2 bg-zinc-900/60 rounded border border-zinc-800/40">
            <p className="text-xs text-zinc-400 font-mono truncate">
              {track.preview_path}
            </p>
            <p className="text-[10px] text-zinc-600 mt-1">
              30-60s clip for non-purchasers
            </p>
          </div>
        )}
        <UploadField
          label={hasPreview ? "Replace Preview" : "Upload Preview (30-60s)"}
          accept="audio/mpeg,audio/aac,audio/mp4,audio/wav"
          maxSizeMB={10}
          uploadUrl="/api/admin/tracks/upload-preview"
          trackId={track.id}
          currentValue={null}
          onUploaded={() => router.refresh()}
        />
      </div>

      {/* Cover Image */}
      <div className="border border-zinc-800/60 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
            Cover Art
          </span>
          {hasCover ? (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-900/30 text-emerald-400 border border-emerald-800/40">
              ✓ Uploaded
            </span>
          ) : (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-800 text-zinc-600 border border-zinc-700">
              Optional
            </span>
          )}
        </div>
        {hasCover && track.cover_url && (
          <div className="mb-3">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={track.cover_url}
              alt={`${track.title} cover`}
              className="w-full h-32 object-cover rounded border border-zinc-800/40"
            />
          </div>
        )}
        <UploadField
          label={hasCover ? "Replace Cover" : "Upload Cover"}
          accept="image/jpeg,image/png,image/webp"
          maxSizeMB={5}
          uploadUrl="/api/admin/tracks/upload-cover"
          trackId={track.id}
          currentValue={null}
          onUploaded={() => router.refresh()}
        />
      </div>
    </div>
  );
}
