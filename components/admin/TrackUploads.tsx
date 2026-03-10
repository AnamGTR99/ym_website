"use client";

import { useRouter } from "next/navigation";
import type { Track } from "@/lib/supabase/tracks";
import UploadField from "./UploadField";

export default function TrackUploads({ track }: { track: Track }) {
  const router = useRouter();

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-mono text-zinc-500 uppercase tracking-wider">
        Files
      </h2>

      <UploadField
        label="Audio File"
        accept="audio/mpeg,audio/aac,audio/mp4,audio/wav"
        maxSizeMB={50}
        uploadUrl="/api/admin/tracks/upload-audio"
        trackId={track.id}
        currentValue={
          track.audio_path !== "pending" ? track.audio_path : null
        }
        onUploaded={() => router.refresh()}
      />

      <UploadField
        label="Cover Image"
        accept="image/jpeg,image/png,image/webp"
        maxSizeMB={5}
        uploadUrl="/api/admin/tracks/upload-cover"
        trackId={track.id}
        currentValue={track.cover_url}
        onUploaded={() => router.refresh()}
      />
    </div>
  );
}
