"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEnvStore } from "@/stores/env";

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
    <div className="relative w-full h-screen overflow-hidden">
      {/* Video background — placeholder uses CSS gradient until Hugo delivers MP4 */}
      <div className="absolute inset-0">
        {/* When Hugo's video is ready, replace this with:
            <video
              autoPlay muted loop playsInline
              preload="metadata"
              poster="/placeholders/landing-poster.webp"
              className="w-full h-full object-cover"
            >
              <source src="/placeholders/landing-bg.mp4" type="video/mp4" />
            </video>
        */}
        <div className="w-full h-full bg-gradient-to-b from-zinc-950 via-[#0a0f0d] to-[#050a08]" />
      </div>

      {/* Atmospheric grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Fog layers — CSS animated */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-1/3 bg-gradient-to-t from-black/40 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-black/30 to-transparent" />
      </div>

      {/* Center content */}
      <div className="absolute inset-0 flex flex-col items-center justify-center z-10">
        {/* Title */}
        <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold uppercase tracking-[0.3em] text-white/90 text-center select-none">
          Yunmakai
        </h1>

        <p className="text-xs sm:text-sm font-mono text-zinc-500 mt-4 tracking-[0.2em] uppercase">
          An immersive digital universe
        </p>

        {/* Enter button */}
        <button
          onClick={handleEnter}
          disabled={transitioning}
          className="mt-12 px-8 py-3 border border-zinc-600 rounded-full text-sm font-mono text-zinc-300 uppercase tracking-wider hover:border-white hover:text-white transition-all duration-300 disabled:opacity-50"
        >
          {transitioning ? "Entering..." : "Enter"}
        </button>
      </div>

      {/* Transition overlay — fades to black when transitioning */}
      <div
        className={`absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-[1200ms] ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
