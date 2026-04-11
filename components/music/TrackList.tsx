"use client";

import Image from "next/image";
import { useMusicStore } from "@/stores/music";
import type { TrackInfo } from "@/lib/supabase/tracks";

function formatDuration(seconds: number | null): string {
  if (!seconds) return "";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function TrackList({ tracks }: { tracks: TrackInfo[] }) {
  const playTrack = useMusicStore((s) => s.playTrack);
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);

  if (tracks.length === 0) return null;

  return (
    <div className="w-full border border-charcoal rounded overflow-hidden animate-fade-up delay-200">
      <div className="px-4 py-3 border-b border-charcoal bg-abyss">
        <p className="text-label text-fog">
          Linked Tracks
        </p>
      </div>

      <div className="divide-y divide-charcoal">
        {tracks.map((track) => {
          const active = currentTrack?.id === track.id;

          return (
            <button
              key={track.id}
              onClick={() => playTrack(track.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-soot ${
                active ? "bg-soot/50" : ""
              }`}
            >
              {/* Cover */}
              <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-charcoal">
                {track.cover_url ? (
                  <Image
                    src={track.cover_url}
                    alt={track.title}
                    width={40}
                    height={40}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-smoke text-xs">
                    ♪
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-sm font-mono truncate ${
                    active ? "text-amber" : "text-bone"
                  }`}
                >
                  {track.title}
                </p>
                <p className="text-[10px] font-mono text-smoke truncate">
                  {track.artist}
                </p>
              </div>

              {/* Duration */}
              {track.duration_seconds && (
                <span className="text-[10px] font-mono text-smoke flex-shrink-0">
                  {formatDuration(track.duration_seconds)}
                </span>
              )}

              {/* Play indicator */}
              <span className="w-4 text-center flex-shrink-0">
                {active && isPlaying ? (
                  <span className="text-amber text-xs">▶</span>
                ) : (
                  <span className="text-ash hover:text-fog text-xs">
                    ▶
                  </span>
                )}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
