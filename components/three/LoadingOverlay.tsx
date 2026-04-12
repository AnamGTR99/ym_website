"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

type Phase = "loading" | "ready" | "hidden";

/**
 * Full-screen cinematic loader for the R3F scene.
 *
 * Reads drei's useProgress (wraps Three's DefaultLoadingManager) so it
 * picks up GLB + texture loader progress. Shows a branded breathing
 * title while loading, then fades out when the scene is ready.
 *
 * Appears on top of the canvas, nav, and all overlays (z-[60]).
 */
export default function LoadingOverlay() {
  const { active, progress, loaded, total } = useProgress();
  const [phase, setPhase] = useState<Phase>("loading");
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);
  const [startedAt] = useState(() => Date.now());

  // When the loader goes quiet at 100%, hold briefly then fade out.
  useEffect(() => {
    if (!active && progress >= 100 && total > 0) {
      setElapsedMs(Date.now() - startedAt);
      const t1 = setTimeout(() => setPhase("ready"), 400);
      const t2 = setTimeout(() => setPhase("hidden"), 2000);
      return () => {
        clearTimeout(t1);
        clearTimeout(t2);
      };
    }
  }, [active, progress, total, startedAt]);

  if (phase === "hidden") return null;

  const indeterminate = total === 0;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] bg-void flex items-center justify-center pointer-events-none transition-opacity duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        phase === "ready" ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Atmospheric layers — grain + vignette even during load */}
      <div className="grain absolute inset-0" />
      <div className="vignette-heavy absolute inset-0" />

      {/* Subtle warm glow behind the title */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60vw] h-[40vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(212, 168, 83, 0.05) 0%, transparent 60%)",
          filter: "blur(40px)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center px-6 max-w-[90vw]">
        <p className="text-label text-fog animate-fade-down delay-100">
          Solus Records presents
        </p>

        <h1 className="font-display text-bone mt-5 uppercase tracking-[0.3em] text-center text-2xl sm:text-3xl md:text-4xl lg:text-5xl leading-[1.2] animate-breathe">
          Entering
          <br />
          Yunmakai&apos;s Space
        </h1>

        {/* Decorative divider */}
        <div className="w-24 h-px bg-gradient-to-r from-transparent via-amber/50 to-transparent mt-10 animate-fade-in delay-500" />

        {/* Progress readout */}
        <div className="mt-12 w-[260px] flex flex-col items-center gap-3 animate-fade-up delay-700">
          <div className="w-full h-[1px] bg-charcoal overflow-hidden relative">
            {indeterminate ? (
              <div className="absolute inset-y-0 w-1/3 bg-amber/60 animate-indeterminate" />
            ) : (
              <div
                className="h-full bg-amber/70 transition-[width] duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            )}
          </div>
          <p className="text-[10px] font-mono text-fog tabular-nums tracking-[0.2em] uppercase">
            {indeterminate
              ? "Initializing"
              : `${progress.toFixed(0)}% · ${loaded}/${total}`}
          </p>
          {elapsedMs !== null && (
            <p className="text-[9px] font-mono text-smoke tabular-nums tracking-[0.15em] uppercase">
              Tuning signal · {(elapsedMs / 1000).toFixed(1)}s
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
