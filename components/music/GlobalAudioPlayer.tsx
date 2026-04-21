"use client";

import { useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useMusicStore, getAudioElement } from "@/stores/music";
import { useEnvStore } from "@/stores/env";

function formatTime(seconds: number): string {
  if (!isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/* ------------------------------------------------------------------ */
/*  Tape reel — small spinning circle, tied to play state              */
/* ------------------------------------------------------------------ */

function TapeReel({ spinning }: { spinning: boolean }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        position: "relative",
        background:
          "radial-gradient(circle at 50% 50%, #1a120a 0%, #0a0604 40%, #000 100%)",
        border: "1px solid rgba(212,168,83,0.35)",
        boxShadow:
          "inset 0 0 4px rgba(0,0,0,0.9), 0 0 6px rgba(212,168,83,0.18)",
        animation: spinning ? "ymReelSpin 1.8s linear infinite" : undefined,
        flexShrink: 0,
      }}
    >
      {/* 3 spokes */}
      {[0, 60, 120].map((deg) => (
        <div
          key={deg}
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            width: "100%",
            height: 1,
            background: "rgba(212,168,83,0.45)",
            transform: `translate(-50%, -50%) rotate(${deg}deg)`,
          }}
        />
      ))}
      {/* Center hub */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: 4,
          height: 4,
          borderRadius: "50%",
          background: "#d4a853",
          transform: "translate(-50%, -50%)",
          boxShadow: "0 0 3px rgba(212,168,83,0.6)",
        }}
      />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Scrub bar — vintage tape deck progress with amber fill             */
/* ------------------------------------------------------------------ */

function ScrubBar() {
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);
  const seek = useMusicStore((s) => s.seek);
  const barRef = useRef<HTMLDivElement>(null);

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      const bar = barRef.current;
      if (!bar || !duration) return;
      const rect = bar.getBoundingClientRect();
      const ratio = Math.max(
        0,
        Math.min(1, (e.clientX - rect.left) / rect.width)
      );
      seek(ratio * duration);
    },
    [duration, seek]
  );

  const pct = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <div
      ref={barRef}
      onClick={handleClick}
      role="slider"
      aria-label="Track progress"
      aria-valuenow={Math.round(progress)}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      style={{
        position: "relative",
        width: "100%",
        height: 4,
        cursor: "pointer",
        borderRadius: 1,
        background:
          "linear-gradient(180deg, rgba(0,0,0,0.85) 0%, rgba(8,5,2,0.7) 100%)",
        border: "1px solid rgba(212,168,83,0.12)",
        boxShadow: "inset 0 1px 2px rgba(0,0,0,0.85)",
        overflow: "hidden",
      }}
    >
      {/* Tick marks — vintage tape deck look */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "repeating-linear-gradient(90deg, rgba(212,168,83,0.06) 0, rgba(212,168,83,0.06) 1px, transparent 1px, transparent 12px)",
          pointerEvents: "none",
        }}
      />
      {/* Fill */}
      <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          width: `${pct}%`,
          background:
            "linear-gradient(180deg, rgba(232,196,106,0.95) 0%, rgba(212,168,83,0.85) 50%, rgba(176,138,58,0.85) 100%)",
          boxShadow:
            "0 0 6px rgba(212,168,83,0.6), inset 0 1px 0 rgba(255,255,255,0.25)",
          transition: "width 100ms linear",
        }}
      />
      {/* Playhead marker */}
      {pct > 0 && (
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: `${pct}%`,
            width: 1,
            height: "200%",
            background: "rgba(232,196,106,0.9)",
            boxShadow: "0 0 4px rgba(212,168,83,0.8)",
            transform: "translate(-50%, -50%)",
            pointerEvents: "none",
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main player — vintage tape deck bar                                */
/* ------------------------------------------------------------------ */

export default function GlobalAudioPlayer() {
  const currentTrack = useMusicStore((s) => s.currentTrack);
  const isPlaying = useMusicStore((s) => s.isPlaying);
  const progress = useMusicStore((s) => s.progress);
  const duration = useMusicStore((s) => s.duration);
  const volume = useMusicStore((s) => s.volume);
  const muted = useMusicStore((s) => s.muted);
  const buffering = useMusicStore((s) => s.buffering);
  const isPreview = useMusicStore((s) => s.isPreview);
  const previewEnded = useMusicStore((s) => s.previewEnded);
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
      if (isFinite(audio.duration)) setDuration(audio.duration);
    }
    function onEnded() {
      const state = useMusicStore.getState();
      state.pause();
      if (state.isPreview) {
        useMusicStore.setState({ previewEnded: true });
      } else {
        setProgress(0);
      }
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

  if (!currentTrack || tvZoomed) return null;

  const statusLabel = buffering
    ? "BUFFERING"
    : previewEnded
    ? "PREVIEW ENDED"
    : isPlaying
    ? isPreview ? "PREVIEW" : "NOW PLAYING"
    : "PAUSED";

  return (
    <>
      {/* Local keyframes — scoped to the player */}
      <style>{`
        @keyframes ymReelSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ymRecBlink {
          0%, 55% { opacity: 1; }
          56%, 100% { opacity: 0.25; }
        }
        @keyframes ymLedPulse {
          0%, 100% { opacity: 0.55; }
          50% { opacity: 1; }
        }
      `}</style>

      <div
        role="region"
        aria-label="Audio player"
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          zIndex: 40,
          // Housing: warm dark gradient with inset shadow
          background:
            "linear-gradient(180deg, rgba(20,13,6,0.98) 0%, rgba(10,6,2,0.99) 45%, rgba(4,2,0,0.99) 100%)",
          borderTop: "1px solid rgba(212,168,83,0.22)",
          boxShadow:
            "0 -14px 32px rgba(0,0,0,0.6), inset 0 1px 0 rgba(212,168,83,0.08), inset 0 -1px 0 rgba(0,0,0,0.6)",
          fontFamily: "'JetBrains Mono', monospace",
          color: "rgba(232,224,200,0.85)",
        }}
      >
        {/* LED strip — thin amber line at the very top that pulses when playing */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 1,
            background:
              "linear-gradient(90deg, transparent 0%, rgba(212,168,83,0.9) 18%, rgba(232,196,106,1) 50%, rgba(212,168,83,0.9) 82%, transparent 100%)",
            boxShadow: "0 0 8px rgba(212,168,83,0.5)",
            animation: isPlaying ? "ymLedPulse 2.4s ease-in-out infinite" : undefined,
            opacity: isPlaying ? undefined : 0.35,
            pointerEvents: "none",
          }}
        />

        {/* Subtle scanline overlay for CRT/VHS feel */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            backgroundImage:
              "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.2) 2px, rgba(0,0,0,0.2) 3px)",
            mixBlendMode: "multiply",
            pointerEvents: "none",
          }}
        />

        {/* Corner brackets — top left/right */}
        {(["tl", "tr"] as const).map((corner) => (
          <div
            key={corner}
            style={{
              position: "absolute",
              top: 6,
              [corner === "tl" ? "left" : "right"]: 10,
              width: 8,
              height: 8,
              borderTop: "1px solid rgba(212,168,83,0.35)",
              [corner === "tl" ? "borderLeft" : "borderRight"]:
                "1px solid rgba(212,168,83,0.35)",
              pointerEvents: "none",
            }}
          />
        ))}

        {/* Error bar */}
        {error && (
          <div
            style={{
              padding: "5px 18px",
              background: "rgba(220,38,38,0.08)",
              borderBottom: "1px solid rgba(220,38,38,0.25)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              position: "relative",
              zIndex: 2,
            }}
          >
            <p
              style={{
                fontSize: 9,
                color: "#ef4444",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                margin: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              ⚠ {error}
            </p>
            <div style={{ display: "flex", gap: 10, marginLeft: 12 }}>
              <button
                onClick={retryUrl}
                style={{
                  fontSize: 9,
                  color: "#ef4444",
                  background: "transparent",
                  border: "1px solid rgba(220,38,38,0.4)",
                  padding: "2px 8px",
                  letterSpacing: "0.25em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  fontFamily: "inherit",
                }}
              >
                Retry
              </button>
              <button
                onClick={clearError}
                style={{
                  color: "rgba(239,68,68,0.7)",
                  background: "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 12,
                }}
                aria-label="Dismiss error"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Preview-ended CTA */}
        {previewEnded && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 10,
              background: "rgba(10,6,2,0.94)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: "#d4a853",
                letterSpacing: "0.25em",
                textTransform: "uppercase",
                fontFamily: "'JetBrains Mono', monospace",
              }}
            >
              PREVIEW ENDED — PURCHASE FOR FULL ACCESS
            </span>
            <button
              onClick={stop}
              style={{
                fontSize: 9,
                color: "rgba(212,168,83,0.7)",
                background: "transparent",
                border: "1px solid rgba(212,168,83,0.3)",
                padding: "4px 12px",
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                cursor: "pointer",
                fontFamily: "'JetBrains Mono', monospace",
                borderRadius: 2,
              }}
            >
              DISMISS
            </button>
          </div>
        )}

        {/* Main deck body */}
        <div
          style={{
            position: "relative",
            zIndex: 2,
            display: "flex",
            alignItems: "center",
            gap: 16,
            padding: "14px 22px 14px 22px",
            minHeight: 84,
          }}
        >
          {/* LEFT: Tape reel + cover + tape reel (VHS framing) */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <TapeReel spinning={isPlaying && !buffering} />

            {/* Cover art in recessed VHS frame */}
            <div
              style={{
                position: "relative",
                width: 56,
                height: 56,
                borderRadius: 2,
                background: "#0a0604",
                border: "1px solid rgba(212,168,83,0.32)",
                boxShadow:
                  "inset 0 0 14px rgba(0,0,0,0.9), 0 0 14px rgba(212,168,83,0.08), 0 0 0 1px rgba(0,0,0,0.5)",
                overflow: "hidden",
                flexShrink: 0,
              }}
            >
              {currentTrack.coverUrl ? (
                <Image
                  src={currentTrack.coverUrl}
                  alt={currentTrack.title}
                  width={56}
                  height={56}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                    filter: "saturate(0.75) contrast(1.05)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    background:
                      "radial-gradient(circle at 50% 45%, rgba(40,28,14,0.8) 0%, rgba(0,0,0,0.95) 70%)",
                    color: "rgba(212,168,83,0.5)",
                    fontSize: 18,
                  }}
                >
                  ♪
                </div>
              )}
              {/* Scanline overlay on the cover */}
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background:
                    "repeating-linear-gradient(0deg, transparent 0, transparent 2px, rgba(0,0,0,0.32) 2px, rgba(0,0,0,0.32) 3px)",
                  pointerEvents: "none",
                }}
              />
              {/* Corner viewfinder marks */}
              {(
                [
                  ["tl", "top: 2px; left: 2px; border-top: 1px solid; border-left: 1px solid;"],
                  ["tr", "top: 2px; right: 2px; border-top: 1px solid; border-right: 1px solid;"],
                  ["bl", "bottom: 2px; left: 2px; border-bottom: 1px solid; border-left: 1px solid;"],
                  ["br", "bottom: 2px; right: 2px; border-bottom: 1px solid; border-right: 1px solid;"],
                ] as const
              ).map(([id, css]) => (
                <div
                  key={id}
                  style={{
                    position: "absolute",
                    width: 6,
                    height: 6,
                    borderColor: "rgba(212,168,83,0.55)",
                    ...Object.fromEntries(
                      css
                        .split(";")
                        .map((s) => s.trim())
                        .filter(Boolean)
                        .map((s) => {
                          const [k, v] = s.split(":").map((x) => x.trim());
                          return [
                            k.replace(/-([a-z])/g, (_, c) => c.toUpperCase()),
                            v,
                          ];
                        })
                    ),
                  }}
                />
              ))}
            </div>

            <TapeReel spinning={isPlaying && !buffering} />
          </div>

          {/* CENTER: status + title + progress */}
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
              gap: 5,
            }}
          >
            {/* Top row: status indicator + time readout */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 7,
                  fontSize: 9,
                  letterSpacing: "0.32em",
                  textTransform: "uppercase",
                  color: isPlaying
                    ? "#d4a853"
                    : "rgba(212,168,83,0.55)",
                  fontWeight: 600,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background:
                      isPlaying && !buffering
                        ? "#ff2d2d"
                        : buffering
                        ? "#d4a853"
                        : "rgba(212,168,83,0.45)",
                    boxShadow:
                      isPlaying && !buffering
                        ? "0 0 8px #ff2d2d, 0 0 2px #ff2d2d"
                        : "0 0 4px rgba(212,168,83,0.4)",
                    animation:
                      isPlaying && !buffering
                        ? "ymRecBlink 1s step-end infinite"
                        : buffering
                        ? "ymLedPulse 0.9s ease-in-out infinite"
                        : undefined,
                  }}
                />
                <span>{statusLabel}</span>
                <span
                  style={{
                    color: "rgba(212,168,83,0.3)",
                    margin: "0 4px",
                  }}
                >
                  {"//"}
                </span>
                <span
                  style={{
                    color: "rgba(232,224,200,0.45)",
                    letterSpacing: "0.28em",
                  }}
                >
                  CH · AUX
                </span>
              </div>

              <div
                style={{
                  fontSize: 10,
                  color: "#d4a853",
                  letterSpacing: "0.18em",
                  fontVariantNumeric: "tabular-nums",
                  display: "flex",
                  alignItems: "baseline",
                  gap: 4,
                  flexShrink: 0,
                }}
              >
                <span
                  style={{
                    color: "rgba(212,168,83,0.95)",
                    textShadow: "0 0 6px rgba(212,168,83,0.45)",
                  }}
                >
                  {formatTime(progress)}
                </span>
                <span style={{ color: "rgba(212,168,83,0.35)" }}>/</span>
                <span style={{ color: "rgba(212,168,83,0.55)" }}>
                  {formatTime(duration)}
                </span>
              </div>
            </div>

            {/* Title + artist */}
            <div style={{ minWidth: 0 }}>
              <p
                title={currentTrack.title}
                style={{
                  fontFamily: "Georgia, 'Times New Roman', serif",
                  fontSize: 15,
                  lineHeight: 1.15,
                  letterSpacing: "0.05em",
                  color: "rgba(240,232,210,0.96)",
                  textShadow: "0 0 14px rgba(212,168,83,0.12)",
                  margin: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontWeight: 500,
                }}
              >
                {currentTrack.title}
              </p>
              <p
                title={currentTrack.artist}
                style={{
                  fontSize: 9,
                  letterSpacing: "0.28em",
                  textTransform: "uppercase",
                  color: "rgba(180,168,140,0.6)",
                  margin: "2px 0 0 0",
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                }}
              >
                {currentTrack.artist}
              </p>
            </div>

            {/* Scrub bar */}
            <ScrubBar />
          </div>

          {/* RIGHT: Play/Pause + volume + close */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              flexShrink: 0,
            }}
          >
            {/* Play/Pause — mechanical deck button */}
            <button
              onClick={togglePlay}
              disabled={buffering}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background:
                  "radial-gradient(circle at 50% 35%, rgba(35,25,12,1) 0%, rgba(12,7,2,1) 70%, rgba(0,0,0,1) 100%)",
                border: "1px solid rgba(212,168,83,0.55)",
                color: isPlaying ? "#e8c46a" : "#d4a853",
                cursor: buffering ? "wait" : "pointer",
                opacity: buffering ? 0.55 : 1,
                boxShadow:
                  "inset 0 -2px 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,168,83,0.25), 0 0 14px rgba(212,168,83,0.18)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontFamily: "inherit",
                fontSize: 11,
                transition: "all 180ms ease",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = "#e8c46a";
                e.currentTarget.style.boxShadow =
                  "inset 0 -2px 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,168,83,0.35), 0 0 22px rgba(212,168,83,0.4)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = "rgba(212,168,83,0.55)";
                e.currentTarget.style.boxShadow =
                  "inset 0 -2px 4px rgba(0,0,0,0.7), inset 0 1px 0 rgba(212,168,83,0.25), 0 0 14px rgba(212,168,83,0.18)";
              }}
            >
              {buffering ? (
                <span style={{ fontSize: 9 }}>···</span>
              ) : isPlaying ? (
                <span style={{ fontSize: 11 }}>❚❚</span>
              ) : (
                <span style={{ fontSize: 12, marginLeft: 2 }}>▶</span>
              )}
            </button>

            {/* Volume — speaker + tape-deck fader */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
              }}
              className="hidden sm:flex"
            >
              <button
                onClick={toggleMute}
                aria-label={muted ? "Unmute" : "Mute"}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "rgba(212,168,83,0.7)",
                  cursor: "pointer",
                  fontSize: 11,
                  padding: 2,
                  transition: "color 180ms",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = "#e8c46a";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = "rgba(212,168,83,0.7)";
                }}
              >
                {muted || volume === 0
                  ? "◌"
                  : volume < 0.5
                  ? "◐"
                  : "●"}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={muted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                aria-label="Volume"
                className="ym-volume"
                style={{
                  width: 64,
                  height: 3,
                  WebkitAppearance: "none",
                  appearance: "none",
                  background:
                    "linear-gradient(180deg, rgba(0,0,0,0.9) 0%, rgba(8,5,2,0.7) 100%)",
                  border: "1px solid rgba(212,168,83,0.2)",
                  borderRadius: 1,
                  outline: "none",
                  cursor: "pointer",
                  boxShadow: "inset 0 1px 2px rgba(0,0,0,0.85)",
                }}
              />
            </div>

            {/* Divider */}
            <div
              style={{
                width: 1,
                height: 28,
                background:
                  "linear-gradient(180deg, transparent 0%, rgba(212,168,83,0.2) 50%, transparent 100%)",
              }}
            />

            {/* Close */}
            <button
              onClick={stop}
              aria-label="Close player"
              style={{
                background: "transparent",
                border: "1px solid rgba(212,168,83,0.2)",
                color: "rgba(212,168,83,0.55)",
                cursor: "pointer",
                fontSize: 10,
                width: 24,
                height: 24,
                borderRadius: 2,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                transition: "all 180ms",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = "#e8c46a";
                e.currentTarget.style.borderColor = "rgba(232,196,106,0.55)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = "rgba(212,168,83,0.55)";
                e.currentTarget.style.borderColor = "rgba(212,168,83,0.2)";
              }}
            >
              ✕
            </button>
          </div>
        </div>

        {/* Volume slider thumb styling */}
        <style>{`
          .ym-volume::-webkit-slider-thumb {
            -webkit-appearance: none;
            appearance: none;
            width: 10px;
            height: 10px;
            border-radius: 1px;
            background: linear-gradient(180deg, #e8c46a 0%, #d4a853 50%, #8a6a2a 100%);
            border: 1px solid rgba(0,0,0,0.8);
            box-shadow: 0 0 6px rgba(212,168,83,0.55), inset 0 1px 0 rgba(255,255,255,0.3);
            cursor: pointer;
          }
          .ym-volume::-moz-range-thumb {
            width: 10px;
            height: 10px;
            border-radius: 1px;
            background: linear-gradient(180deg, #e8c46a 0%, #d4a853 50%, #8a6a2a 100%);
            border: 1px solid rgba(0,0,0,0.8);
            box-shadow: 0 0 6px rgba(212,168,83,0.55);
            cursor: pointer;
          }
        `}</style>
      </div>
    </>
  );
}
