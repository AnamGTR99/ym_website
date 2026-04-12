"use client";

import { useCallback, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useGLTF } from "@react-three/drei";
import { useEnvStore } from "@/stores/env";
import StarField from "./StarField";

useGLTF.preload("/models/room.glb", "/draco/", true);

export default function LandingEnvironment() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fadeRef = useRef<HTMLDivElement>(null);

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    startTransition("room", () => {
      router.push("/room");
    });
  }, [transitioning, startTransition, router]);

  // Smooth loop crossfade — fades to black near the end, fades back on restart
  useEffect(() => {
    const video = videoRef.current;
    const fade = fadeRef.current;
    if (!video || !fade) return;

    const FADE_DURATION = 2;

    function onTimeUpdate() {
      if (!video || !fade) return;
      const remaining = video.duration - video.currentTime;
      if (remaining < FADE_DURATION) {
        fade.style.opacity = String(1 - remaining / FADE_DURATION);
      } else if (video.currentTime < FADE_DURATION) {
        fade.style.opacity = String(1 - video.currentTime / FADE_DURATION);
      } else {
        fade.style.opacity = "0";
      }
    }

    video.addEventListener("timeupdate", onTimeUpdate);
    return () => video.removeEventListener("timeupdate", onTimeUpdate);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* Base — bayou video with night color grade */}
      <div className="absolute inset-0">
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
          style={{
            filter: "brightness(0.45) saturate(0.4) contrast(1.2) sepia(0.1) hue-rotate(190deg)",
          }}
        >
          <source src="/video/landing-bg-web.mp4" type="video/mp4" />
        </video>

        {/* Loop crossfade overlay — JS-controlled opacity */}
        <div
          ref={fadeRef}
          className="absolute inset-0 bg-void pointer-events-none"
          style={{ opacity: 0, transition: "opacity 0.15s linear" }}
        />

        {/* Night sky gradient */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(180deg, #020810 0%, rgba(5,15,25,0.4) 35%, transparent 55%, rgba(3,8,12,0.6) 80%, #020508 100%)",
          }}
        />

        {/* Edge darkening for text readability */}
        <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-void/80 to-transparent" />
        <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-void/60 to-transparent" />
      </div>

      {/* Starfield */}
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
        <p className="text-[10px] font-mono text-fog/60 tracking-[0.35em] uppercase animate-fade-down delay-200">
          Solus Records presents
        </p>

        <h1 className="mt-7 text-center animate-breathe">
          <span className="block font-display text-bone uppercase tracking-[0.4em] text-4xl sm:text-5xl md:text-6xl lg:text-7xl leading-none">
            Yunmakai
          </span>
        </h1>

        <div className="w-20 h-px bg-gradient-to-r from-transparent via-amber/30 to-transparent mt-9 animate-fade-in delay-500" />

        <p className="font-mono text-[11px] text-fog/60 mt-6 tracking-[0.2em] uppercase animate-fade-up delay-500">
          An immersive digital universe
        </p>

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

        <p className="mt-12 text-[10px] font-mono text-fog/50 tracking-[0.2em] uppercase animate-fade-in delay-1000">
          Best experienced with sound
        </p>
      </div>

      {/* Bottom attribution */}
      <div className="absolute bottom-5 left-0 right-0 z-10 flex justify-center pointer-events-none">
        <p className="text-[10px] font-mono text-fog/40 tracking-[0.15em]">
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
