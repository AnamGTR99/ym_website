"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useMusicStore, getAudioElement } from "@/stores/music";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export default function GlobalAudioPlayer() {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const buffering = useMusicStore((s) => s.buffering);
  const error = useMusicStore((s) => s.error);

  const togglePlay = useMusicStore((s) => s.togglePlay);
  const seek = useMusicStore((s) => s.seek);
  const setVolume = useMusicStore((s) => s.setVolume);
  const toggleMute = useMusicStore((s) => s.toggleMute);
  const setProgress = useMusicStore((s) => s.setProgress);
  const setDuration = useMusicStore((s) => s.setDuration);
  const setBuffering = useMusicStore((s) => s.setBuffering);
  const stop = useMusicStore((s) => s.stop);
  const retryUrl = useMusicStore((s) => s.retryUrl);
  const clearError = useMusicStore((s) => s.clearError);

  const progressBarRef = useRef<HTMLDivElement>(null);

  // Bind audio element events
  useEffect(() => {
    const audio = getAudioElement();

    function onTimeUpdate() {
      setProgress(audio.currentTime);
    }

    function onLoadedMetadata() {
      if (isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    }

    function onEnded() {
      useMusicStore.getState().pause();
      setProgress(0);
    }

    function onWaiting() {
      setBuffering(true);
    }

    function onCanPlay() {
      setBuffering(false);
    }

    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);

    return () => {
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
    };
  }, [setProgress, setDuration, setBuffering]);

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

  // Hidden when no track
  if (!currentTrack) return null;

  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-zinc-950 border-t border-zinc-800">
      {/* Error bar */}
      {error && (
        <div className="px-4 py-1.5 bg-red-400/10 border-b border-red-400/20 flex items-center justify-between">
          <p className="text-[10px] font-mono text-red-400 truncate">{error}</p>
          <div className="flex gap-2 ml-2 flex-shrink-0">
            <button
              onClick={retryUrl}
              className="text-[10px] font-mono text-red-400 hover:text-white transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="text-red-400/60 hover:text-red-400 text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Progress bar (clickable) */}
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

      {/* Player controls */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Cover */}
        <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-zinc-900">
          {currentTrack.coverUrl ? (
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-zinc-700 text-xs font-mono">
              ♪
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-white truncate">
            {currentTrack.title}
          </p>
          <p className="text-[10px] font-mono text-zinc-500 truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Time */}
        <span className="text-[10px] font-mono text-zinc-500 hidden sm:block">
          {formatTime(progress)} / {formatTime(duration)}
        </span>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={buffering}
          className="w-8 h-8 flex items-center justify-center border border-zinc-700 rounded-full text-white hover:border-white disabled:opacity-50 transition-colors"
          aria-label={isPlaying ? "Pause" : "Play"}
        >
          {buffering ? (
            <span className="text-[10px] font-mono animate-pulse">···</span>
          ) : isPlaying ? (
            <span className="text-xs">❚❚</span>
          ) : (
            <span className="text-xs ml-0.5">▶</span>
          )}
        </button>

        {/* Volume */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            onClick={toggleMute}
            className="text-zinc-500 hover:text-white text-xs transition-colors"
            aria-label={muted ? "Unmute" : "Mute"}
          >
            {muted || volume === 0 ? "🔇" : volume < 0.5 ? "🔉" : "🔊"}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={muted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-16 h-1 appearance-none bg-zinc-700 rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            aria-label="Volume"
          />
        </div>

        {/* Close */}
        <button
          onClick={stop}
          className="text-zinc-600 hover:text-white text-xs transition-colors ml-1"
          aria-label="Close player"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
