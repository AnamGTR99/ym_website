"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useGLTF } from "@react-three/drei";
import { useEnvStore } from "@/stores/env";
import StarField from "./StarField";

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
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* Base — video heavily darkened with Ozark teal-green tint */}
      <div className="absolute inset-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-70"
        >
          <source src="/video/landing-bg-web.mp4" type="video/mp4" />
        </video>

        {/* Subtle Ozark tint — lets the lake show through */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #030a0f 0%, transparent 30%, transparent 60%, #030508 100%)",
            opacity: 0.6,
          }}
        />

        {/* Edge darkening — keeps text readable over the lake */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-void/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-void/60 to-transparent" />
      </div>

      {/* Starfield — parallax CSS stars */}
      <StarField />

      {/* Atmospheric layers */}
      <div className="grain absolute inset-0" />
      <div className="vignette-heavy absolute inset-0" />

      {/* Warm glow behind title */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[60vw] h-[40vh] pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse, rgba(212, 168, 83, 0.035) 0%, transparent 50%)",
          filter: "blur(80px)",
        }}
      />

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6">
        {/* Label */}
        <p className="text-[10px] font-mono text-fog/50 tracking-[0.35em] uppercase animate-fade-down delay-200">
          Solus Records presents
        </p>

        {/* Title */}
        <h1 className="mt-7 text-center animate-breathe">
          <span className="block font-display text-bone uppercase tracking-[0.4em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none">
            Yunmakai
          </span>
        </h1>

        {/* Divider */}
        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent mt-9 animate-fade-in delay-500" />

        {/* Tagline */}
        <p className="font-mono text-[11px] text-fog/40 mt-6 tracking-[0.2em] uppercase animate-fade-up delay-500">
          An immersive digital universe
        </p>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={transitioning}
          className="mt-14 group relative animate-fade-up delay-700"
        >
          <span className="relative z-10 inline-flex items-center gap-3 px-14 py-4 font-mono text-[11px] uppercase tracking-[0.3em] text-bone/80 border border-bone/15 rounded-sm transition-all duration-700 group-hover:border-amber/40 group-hover:text-amber group-hover:tracking-[0.35em] disabled:opacity-20">
            {transitioning ? "Entering..." : "Enter"}
          </span>
          <span className="absolute inset-0 rounded-sm animate-pulse-glow opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
        </button>

        {/* Sound hint */}
        <p className="mt-12 text-[9px] font-mono text-smoke/25 tracking-[0.2em] uppercase animate-fade-in delay-1000">
          Best experienced with sound
        </p>
      </div>

      {/* Bottom attribution */}
      <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <p className="text-[9px] font-mono text-smoke/20 tracking-[0.15em]">
          © 2026 Yunmakai LLC · Solus Records · Lunas Lake Studio
        </p>
      </div>

      {/* Transition fade-to-black */}
      <div
        className={`absolute inset-0 bg-void z-20 pointer-events-none transition-opacity duration-[1500ms] ease-[cubic-bezier(0.22,1,0.36,1)] ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
