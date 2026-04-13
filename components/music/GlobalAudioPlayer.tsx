"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useMusicStore, getAudioElement } from "@/stores/music";
import { useEnvStore } from "@/stores/env";
import ProgressBar from "./ProgressBar";

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
  const setVolume = useMusicStore((s) => s.setVolume);
  const toggleMute = useMusicStore((s) => s.toggleMute);
  const setProgress = useMusicStore((s) => s.setProgress);
  const setDuration = useMusicStore((s) => s.setDuration);
  const setBuffering = useMusicStore((s) => s.setBuffering);
  const stop = useMusicStore((s) => s.stop);
  const retryUrl = useMusicStore((s) => s.retryUrl);
  const clearError = useMusicStore((s) => s.clearError);

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

  // Hide whenever the in-CRT player is visible — TVProductDetail has its
  // own cinematic strip. Two stacked players look redundant.
  const tvZoomed = useEnvStore((s) => s.tvZoomed);

  // Hidden when no track or when the TV's own player is taking over
  if (!currentTrack || tvZoomed) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-abyss border-t border-charcoal">
      {/* Error bar */}
      {error && (
        <div className="px-4 py-1.5 bg-error/10 border-b border-error/20 flex items-center justify-between">
          <p className="text-[10px] font-mono text-error truncate">{error}</p>
          <div className="flex gap-2 ml-2 flex-shrink-0">
            <button
              onClick={retryUrl}
              className="text-[10px] font-mono text-error hover:text-bone transition-colors"
            >
              Retry
            </button>
            <button
              onClick={clearError}
              className="text-error/60 hover:text-error text-xs"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Progress bar — isolated component to avoid re-rendering the entire player on timeupdate */}
      <ProgressBar />

      {/* Player controls */}
      <div className="flex items-center gap-3 px-4 py-2.5">
        {/* Cover */}
        <div className="w-10 h-10 flex-shrink-0 rounded overflow-hidden bg-soot">
          {currentTrack.coverUrl ? (
            <Image
              src={currentTrack.coverUrl}
              alt={currentTrack.title}
              width={40}
              height={40}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-ash text-xs font-mono">
              ♪
            </div>
          )}
        </div>

        {/* Track info */}
        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono text-bone truncate">
            {currentTrack.title}
          </p>
          <p className="text-[10px] font-mono text-fog truncate">
            {currentTrack.artist}
          </p>
        </div>

        {/* Time */}
        <span className="text-[10px] font-mono text-amber hidden sm:block">
          {formatTime(progress)} / {formatTime(duration)}
        </span>

        {/* Play/Pause */}
        <button
          onClick={togglePlay}
          disabled={buffering}
          className="w-8 h-8 flex items-center justify-center border border-ash rounded-full text-bone hover:border-amber hover:text-amber disabled:opacity-50 transition-colors"
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
            className="text-fog hover:text-bone text-xs transition-colors"
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
            className="w-16 h-1 appearance-none bg-ash rounded-full cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-amber"
            aria-label="Volume"
          />
        </div>

        {/* Close */}
        <button
          onClick={stop}
          className="text-smoke hover:text-bone text-xs transition-colors ml-1"
          aria-label="Close player"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
