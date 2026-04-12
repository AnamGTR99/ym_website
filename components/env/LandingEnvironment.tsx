"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGLTF } from "@react-three/drei";
import { useEnvStore } from "@/stores/env";

// Background preload — starts fetching the motel room GLB while the user
// watches the bayou landing video. By the time they click "Enter", the GLB
// is cached in memory and the /room page renders near-instantly.
// useGLTF.preload does NOT need a Canvas or WebGL context.
useGLTF.preload("/models/room.glb", "/draco/", true);

export default function LandingEnvironment() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    startTransition("room", () => {
      router.push("/room");
    });
  }, [transitioning, startTransition, router]);

  return (
    <div className="grain vignette-heavy relative w-full h-screen overflow-hidden">
      {/* Background — bayou video */}
      <div className="absolute inset-0 bg-void">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/video/landing-bg-web.mp4" type="video/mp4" />
        </video>
        {/* Dark overlays for text readability + atmosphere */}
        <div className="absolute inset-0 bg-void/40" />
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-void/90 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-void/60 to-transparent" />
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        {/* Pre-title label */}
        <p className="text-label text-fog animate-fade-down delay-200">
          Solus Records presents
        </p>

        {/* Title */}
        <h1 className="text-display-hero text-bone mt-4 uppercase tracking-[0.25em] text-center select-none animate-fade-up delay-300">
          Yunmakai
        </h1>

        {/* Subtitle */}
        <p className="font-mono text-sm text-fog/60 mt-3 tracking-[0.15em] uppercase animate-fade-up delay-400">
          An immersive digital universe
        </p>

        {/* Decorative line */}
        <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent mt-8 animate-fade-in delay-500" />

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={transitioning}
          className="btn btn-secondary mt-10 px-10 py-3 tracking-[0.2em] animate-fade-up delay-600 hover:border-amber hover:text-amber hover:glow-amber disabled:opacity-30 transition-all"
        >
          {transitioning ? "Entering..." : "Enter"}
        </button>

      </div>

      {/* Transition overlay — fades to black when transitioning */}
      <div
        className={`absolute inset-0 bg-void z-20 pointer-events-none transition-opacity duration-[1200ms] ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
