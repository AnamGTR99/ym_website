"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGLTF } from "@react-three/drei";
import { useEnvStore } from "@/stores/env";

// Background preload the room GLB while user is on the landing page
useGLTF.preload("/models/setup.glb", true, false);

/* ------------------------------------------------------------------ */
/*  Scramble-flicker title                                             */
/*  Shows YUNMAKAI normally, then every few seconds a random burst of  */
/*  characters replaces some letters before resolving back.            */
/* ------------------------------------------------------------------ */

const GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*!?/\\|[]{}~^";
const TARGET = "YUNMAKAI";

function GlitchTitle() {
  const [display, setDisplay] = useState(TARGET);
  const glitching = useRef(false);

  useEffect(() => {
    // Fire a glitch burst every 3–6 seconds
    function scheduleGlitch() {
      const delay = 3000 + Math.random() * 3000;
      return setTimeout(() => {
        if (glitching.current) return;
        glitching.current = true;

        // Pick 2–4 random positions to glitch
        const count = 2 + Math.floor(Math.random() * 3);
        const positions = new Set<number>();
        while (positions.size < count) {
          positions.add(Math.floor(Math.random() * TARGET.length));
        }

        // Rapid cycle for ~300ms
        let cycles = 0;
        const maxCycles = 6;
        const cycleId = setInterval(() => {
          cycles++;
          setDisplay(
            TARGET.split("")
              .map((ch, i) =>
                positions.has(i) && cycles <= maxCycles
                  ? GLYPHS[Math.floor(Math.random() * GLYPHS.length)]
                  : ch
              )
              .join("")
          );
          if (cycles > maxCycles) {
            clearInterval(cycleId);
            setDisplay(TARGET);
            glitching.current = false;
          }
        }, 50);

        timer = scheduleGlitch();
      }, delay);
    }

    let timer = scheduleGlitch();
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {display.split("").map((ch, i) => (
        <span
          key={i}
          style={{
            display: "inline-block",
            transition: ch !== TARGET[i] ? "none" : "opacity 150ms ease",
            opacity: ch !== TARGET[i] ? 0.6 : 1,
          }}
        >
          {ch}
        </span>
      ))}
    </>
  );
}

/* ------------------------------------------------------------------ */
/*  Landing page                                                       */
/* ------------------------------------------------------------------ */

export default function LandingEnvironment() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Preloader state
  const [videoReady, setVideoReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const ready = videoReady && minElapsed;

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    startTransition("room", () => router.push("/room"));
  }, [transitioning, startTransition, router]);

  // Wait for video to buffer
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (v.readyState >= 3) { setVideoReady(true); return; }
    const onReady = () => setVideoReady(true);
    v.addEventListener("canplaythrough", onReady);
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("error", onReady);
    const hard = setTimeout(() => setVideoReady(true), 6000);
    return () => {
      v.removeEventListener("canplaythrough", onReady);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onReady);
      clearTimeout(hard);
    };
  }, []);

  // Minimum loader display time
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1200);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="relative w-full h-screen overflow-hidden select-none bg-void">
      {/* ---- Scene (fades in when ready) ---- */}
      <div
        className="absolute inset-0"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 1400ms cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDelay: ready ? "100ms" : "0ms",
        }}
      >
        {/* Video — Ken Burns drift + flicker, visible but dark */}
        <div className="absolute inset-[-3%] animate-ken-burns">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="w-full h-full object-cover animate-film-flicker"
            style={{
              filter: "brightness(0.42) saturate(0.35) contrast(1.15) sepia(0.1) hue-rotate(190deg)",
            }}
          >
            <source src="/video/landing-bg-web.mp4" type="video/mp4" />
          </video>
        </div>

        {/* Gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(5,5,5,0.85) 0%, rgba(5,5,5,0.5) 40%, rgba(5,5,5,0.35) 55%, rgba(5,5,5,0.6) 75%, rgba(5,5,5,0.92) 100%)",
          }}
        />

        {/* Grain + vignette + scanlines */}
        <div className="grain absolute inset-0" />
        <div className="vignette-heavy absolute inset-0" />
        <div className="scanlines absolute inset-0" />

        {/* ---- Content ---- */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
          style={{
            opacity: transitioning ? 0 : 1,
            transition: "opacity 1200ms ease",
          }}
        >
          {/* Solus Records — small, subtle */}
          <p
            className="font-ym-title text-[11px] text-bone/30 tracking-[0.5em] uppercase animate-fade-down"
            style={{ animationDelay: "200ms", animationFillMode: "backwards" }}
          >
            Solus Records
          </p>

          {/* YUNMAKAI — large, semi-transparent, video bleeds through */}
          <h1
            className="mt-6 text-center animate-fade-up"
            style={{ animationDelay: "400ms", animationFillMode: "backwards" }}
          >
            <span
              className="block font-ym-title uppercase tracking-[0.3em] text-5xl sm:text-6xl md:text-7xl lg:text-8xl leading-none"
              style={{
                color: "rgba(224, 224, 224, 0.75)",
                mixBlendMode: "screen",
                textShadow: "0 0 60px rgba(200, 200, 200, 0.08), 0 0 120px rgba(200, 200, 200, 0.03)",
              }}
            >
              <GlitchTitle />
            </span>
          </h1>

          {/* Enter → minimal text link */}
          <button
            onClick={handleEnter}
            disabled={transitioning}
            className="mt-16 animate-fade-up"
            style={{ animationDelay: "800ms", animationFillMode: "backwards" }}
          >
            <span
              className="font-ym-title text-[12px] text-bone/40 tracking-[0.4em] uppercase transition-all duration-500 hover:text-bone/80 hover:tracking-[0.5em] hover:text-shadow disabled:opacity-20 inline-flex items-center gap-3"
            >
              Enter
              <span className="text-[14px] transition-transform duration-500 group-hover:translate-x-1">→</span>
            </span>
          </button>
        </div>

        {/* Transition fade-to-black */}
        <div
          className="absolute inset-0 bg-void z-20 pointer-events-none"
          style={{
            opacity: transitioning ? 1 : 0,
            transition: "opacity 1500ms cubic-bezier(0.4, 0, 0.2, 1)",
            transitionDelay: transitioning ? "1200ms" : "0ms",
          }}
        />
      </div>

      {/* ---- Preloader (black → fade out) ---- */}
      <div
        className="absolute inset-0 z-40 bg-void flex items-center justify-center"
        style={{
          opacity: ready ? 0 : 1,
          transition: "opacity 800ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: ready ? "none" : "auto",
        }}
        aria-hidden={ready}
      >
        <span className="font-ym-title text-bone/60 uppercase tracking-[0.35em] text-2xl sm:text-3xl animate-breathe">
          YUNMAKAI
        </span>
      </div>
    </div>
  );
}
