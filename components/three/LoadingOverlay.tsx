"use client";

import { useEffect, useRef, useState } from "react";
import { useProgress } from "@react-three/drei";
import { useEnvStore } from "@/stores/env";

type Phase = "loading" | "static" | "ready" | "hidden";

/**
 * VHS-themed loading screen for the /room page.
 * Shows "TUNING SIGNAL..." with real progress, scanlines, and tracking bars.
 * Waits for model + shaders + post-processing to fully initialize.
 * Exits with a brief static noise burst then fade.
 */
export default function LoadingOverlay() {
  const { active, progress, total } = useProgress();
  const sceneReady = useEnvStore((s) => s.sceneReady);
  const [phase, setPhase] = useState<Phase>("loading");
  const readyAt = useRef<number | null>(null);

  // Assets loaded = useProgress says 100% and no longer active
  const assetsLoaded = !active && progress >= 100 && total > 0;
  const allReady = (assetsLoaded && sceneReady) || (sceneReady && total === 0);

  // Display progress: 0-90% for assets, jump to 100% when scene compiles
  const showProgress = total > 0;
  const displayProgress = allReady
    ? 100
    : showProgress
      ? Math.min(progress * 0.9, 90)
      : 0;

  // When all ready → wait 800ms for post-processing settle → static burst → fade
  useEffect(() => {
    if (!allReady || phase !== "loading") return;
    if (!readyAt.current) readyAt.current = performance.now();

    const settleDelay = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          // Static burst phase
          setPhase("static");
          // After 300ms burst → fade phase
          setTimeout(() => {
            setPhase("ready");
            // After fade duration → unmount
            setTimeout(() => setPhase("hidden"), 1200);
          }, 300);
        });
      });
    }, 800);

    return () => clearTimeout(settleDelay);
  }, [allReady, phase]);

  // Hard fallback: after 15s, force exit
  useEffect(() => {
    if (phase !== "loading") return;
    const fallback = setTimeout(() => {
      setPhase("static");
      setTimeout(() => {
        setPhase("ready");
        setTimeout(() => setPhase("hidden"), 1200);
      }, 300);
    }, 15000);
    return () => clearTimeout(fallback);
  }, [phase]);

  if (phase === "hidden") return null;

  const isStatic = phase === "static";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] bg-void pointer-events-none transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] ${
        phase === "ready"
          ? "opacity-0 duration-[1200ms]"
          : "opacity-100 duration-0"
      }`}
    >
      {/* Film grain */}
      <div className="grain absolute inset-0" style={{ opacity: 0.04 }} />

      {/* Scanlines */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
          pointerEvents: "none",
        }}
      />

      {/* VHS tracking distortion bar */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)",
          filter: "blur(1px)",
          animation: "vhsLoadTracking 5s linear infinite",
          pointerEvents: "none",
        }}
      />

      {/* CRT edge vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 120px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}
      />

      {/* Static noise burst (during "static" phase) */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isStatic ? 0.3 : 0.02,
          transition: isStatic ? "none" : "opacity 200ms ease",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect fill='white' width='2' height='2'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
          animation: "vhsLoadNoise 0.1s steps(5) infinite",
          mixBlendMode: "overlay" as const,
          pointerEvents: "none",
        }}
      />

      {/* Center content */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          opacity: isStatic ? 0.1 : 1,
          transition: isStatic ? "opacity 100ms ease" : "none",
        }}
      >
        {/* Status text */}
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: allReady
              ? "rgba(224, 224, 224, 0.7)"
              : "rgba(200, 192, 168, 0.4)",
            textShadow: allReady
              ? "0 0 12px rgba(224, 224, 224, 0.15)"
              : "none",
            transition: "color 300ms ease, text-shadow 300ms ease",
          }}
        >
          {allReady ? "SIGNAL LOCKED" : "TUNING SIGNAL"}
        </div>

        {/* Progress bar */}
        <div style={{ width: "220px", display: "flex", flexDirection: "column", gap: "10px", alignItems: "center" }}>
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(224, 224, 224, 0.08)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {!showProgress && !sceneReady ? (
              /* Indeterminate sweep for cached GLB */
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "33%",
                  background: "rgba(224, 224, 224, 0.4)",
                  animation: "vhsLoadSweep 1.8s ease-in-out infinite",
                }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  background: "rgba(224, 224, 224, 0.5)",
                  width: `${displayProgress}%`,
                  transition: "width 300ms ease-out",
                  boxShadow: "0 0 8px rgba(224, 224, 224, 0.2)",
                }}
              />
            )}
          </div>

          {/* Progress number */}
          <div
            style={{
              fontFamily: "'Courier New', monospace",
              fontSize: "10px",
              letterSpacing: "0.25em",
              color: "rgba(200, 192, 168, 0.3)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {String(Math.round(displayProgress)).padStart(3, "0")}
          </div>
        </div>
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes vhsLoadTracking {
          0% { top: -3px; }
          100% { top: 100%; }
        }
        @keyframes vhsLoadNoise {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes vhsLoadSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
