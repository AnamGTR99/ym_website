"use client";

import { useRef, useCallback } from "react";
import { useMusicStore } from "@/stores/music";

export default function ProgressBar() {
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);
  const seek = useMusicStore((s) => s.seek);
  const progressBarRef = useRef<HTMLDivElement>(null);

  const handleProgressClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = progressBarRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      ref={progressBarRef}
      onClick={handleProgressClick}
      className="h-1 bg-zinc-800 cursor-pointer group"
      role="slider"
      aria-label="Track progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
    >
      <div
        className="h-full bg-white transition-[width] duration-100 group-hover:bg-zinc-300"
        style={{ width: `${progressPercent}%` }}
      />
    </div>
  );
}
