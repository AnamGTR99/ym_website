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
    <div className="w-full rounded overflow-hidden animate-fade-up delay-200">
      {/* Header */}
      <div className="px-5 py-3 bg-soot border border-charcoal border-b-0 rounded-t">
        <div className="flex items-center justify-between">
          <p className="text-label text-fog">
            {tracks.length === 1 ? "Track" : `${tracks.length} Tracks`}
          </p>
          <p className="text-[9px] font-mono text-smoke uppercase tracking-[0.15em]">
            Yunmakai
          </p>
        </div>
      </div>

      {/* Track rows */}
      <div className="border border-charcoal border-t-0 rounded-b divide-y divide-charcoal/50">
        {tracks.map((track, i) => {
          const active = currentTrack?.id === track.id;

          return (
            <button
              key={track.id}
              onClick={() => playTrack(track.id)}
              className={`w-full flex items-center gap-4 px-5 py-4 text-left transition-all duration-200 group ${
                active
                  ? "bg-amber/5"
                  : "hover:bg-soot/80"
              }`}
            >
              {/* Track number */}
              <span className={`w-5 text-right text-xs font-mono tabular-nums flex-shrink-0 ${
                active ? "text-amber" : "text-smoke group-hover:hidden"
              }`}>
                {active && isPlaying ? "♫" : String(i + 1).padStart(2, "0")}
              </span>
              <span className="w-5 text-center text-xs flex-shrink-0 hidden group-hover:block text-amber">
                ▶
              </span>

              {/* Cover art */}
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
                  <div className={`w-full h-full flex items-center justify-center text-xs ${
                    active ? "text-amber" : "text-smoke"
                  }`}>
                    ♪
                  </div>
                )}
              </div>

              {/* Track info */}
              <div className="flex-1 min-w-0">
                <p className={`text-sm truncate transition-colors ${
                  active ? "text-amber font-medium" : "text-bone group-hover:text-white"
                }`}>
                  {track.title}
                </p>
                <p className="text-[10px] font-mono text-smoke truncate mt-0.5">
                  {track.artist}
                </p>
              </div>

              {/* Duration */}
              {track.duration_seconds && (
                <span className="text-[10px] font-mono text-smoke flex-shrink-0 tabular-nums">
                  {formatDuration(track.duration_seconds)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
