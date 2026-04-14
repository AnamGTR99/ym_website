"use client";

import { useEffect, useRef, useState } from "react";
import { useEnvStore } from "@/stores/env";

type Phase = "loading" | "ready" | "hidden";

/**
 * Full-screen black overlay for the /room page.
 * Holds the screen black until the 3D scene is fully loaded, compiled,
 * AND post-processing has had time to initialize. Then fades out.
 */
export default function LoadingOverlay() {
  const sceneReady = useEnvStore((s) => s.sceneReady);
  const [phase, setPhase] = useState<Phase>("loading");
  const readyAt = useRef<number | null>(null);

  useEffect(() => {
    if (!sceneReady || phase !== "loading") return;

    // Record when the scene first reported ready
    if (!readyAt.current) readyAt.current = performance.now();

    // Wait an extra 800ms after sceneReady for post-processing to
    // fully initialize (N8AO, Outline, Bloom, etc. mount on the frame
    // AFTER modelReady flips true). This prevents the "effects pop in" flash.
    const settleDelay = setTimeout(() => {
      // Use requestAnimationFrame to ensure we're past the render frame
      // where post-processing has applied
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("ready");
          setTimeout(() => setPhase("hidden"), 1500);
        });
      });
    }, 800);

    return () => clearTimeout(settleDelay);
  }, [sceneReady, phase]);

  // Hard fallback: after 15s, fade out regardless
  useEffect(() => {
    if (phase !== "loading") return;
    const fallback = setTimeout(() => {
      setPhase("ready");
      setTimeout(() => setPhase("hidden"), 1200);
    }, 15000);
    return () => clearTimeout(fallback);
  }, [phase]);

  if (phase === "hidden") return null;

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] bg-void pointer-events-none transition-opacity duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
        phase === "ready" ? "opacity-0" : "opacity-100"
      }`}
    />
  );
}
