"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useGLTF } from "@react-three/drei";
import { useEnvStore } from "@/stores/env";
import StarField from "./StarField";

useGLTF.preload("/models/setup.glb", true, false);

/* ------------------------------------------------------------------ */
/*  Camera config                                                      */
/* ------------------------------------------------------------------ */

const CAM = {
  // Zoom
  minZoom: 1,
  maxZoom: 1.8,
  zoomSpeed: 0.0008,
  zoomLerp: 0.08,

  // Pan (drag)
  panLerp: 0.1,

  // Passive parallax (when not dragging)
  parallax: { scene: { x: 18, y: 10 }, stars: { x: 8, y: 5 }, text: { x: -4, y: -3 } },
  parallaxLerp: 0.035,

  // Momentum after drag release
  friction: 0.92,

  // Transition dive
  diveZoom: 2.2,
  diveBlur: 6,
  diveLerp: 0.025,
};

export default function LandingEnvironment() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);

  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<HTMLDivElement>(null);
  const zoomRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  // --- Preloader state ---
  // Holds a black overlay with a progress bar until the BG video has
  // buffered enough to play, then fades the whole scene in as one unit
  // so stars/video/text don't pop in at different times.
  const [videoReady, setVideoReady] = useState(false);
  const [minElapsed, setMinElapsed] = useState(false);
  const [progress, setProgress] = useState(0);
  const ready = videoReady && minElapsed;

  // Camera state — all in refs for zero re-renders
  const zoom = useRef({ current: 1, target: 1 });
  const pan = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const velocity = useRef({ x: 0, y: 0 });
  const drag = useRef({ active: false, startX: 0, startY: 0, startPanX: 0, startPanY: 0 });
  const mouse = useRef({ x: 0, y: 0, cx: 0, cy: 0 }); // normalized -1..1 + current lerped
  const transRef = useRef(false);
  transRef.current = transitioning;

  const handleEnter = useCallback(() => {
    if (transitioning) return;
    startTransition("room", () => router.push("/room"));
  }, [transitioning, startTransition, router]);

  // --- Preloader: wait for BG video to buffer ---
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    // readyState >= 3 = HAVE_FUTURE_DATA (enough buffered to play)
    if (v.readyState >= 3) {
      setVideoReady(true);
      return;
    }
    const onReady = () => setVideoReady(true);
    v.addEventListener("canplaythrough", onReady);
    v.addEventListener("loadeddata", onReady);
    v.addEventListener("error", onReady); // fail-open so we don't block forever
    // Hard fallback: after 6s, give up and show the scene anyway
    const hardTimeout = setTimeout(() => setVideoReady(true), 6000);
    return () => {
      v.removeEventListener("canplaythrough", onReady);
      v.removeEventListener("loadeddata", onReady);
      v.removeEventListener("error", onReady);
      clearTimeout(hardTimeout);
    };
  }, []);

  // Minimum display time so the loader always feels intentional
  useEffect(() => {
    const t = setTimeout(() => setMinElapsed(true), 1400);
    return () => clearTimeout(t);
  }, []);

  // Progress bar animation: 0 → 88% over ~1.3s, hold until ready, then 100%
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const DURATION = 1300;
    const TARGET = 88;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / DURATION);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      setProgress(TARGET * eased);
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);
  useEffect(() => {
    if (ready) setProgress(100);
  }, [ready]);

  // --- Wheel → zoom ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onWheel(e: WheelEvent) {
      e.preventDefault();
      if (transRef.current) return;
      const z = zoom.current;
      z.target = Math.max(CAM.minZoom, Math.min(CAM.maxZoom, z.target - e.deltaY * CAM.zoomSpeed));
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  // --- Drag → pan ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onDown(e: PointerEvent) {
      if (transRef.current) return;
      if ((e.target as HTMLElement).closest("button")) return; // don't hijack button clicks
      drag.current = { active: true, startX: e.clientX, startY: e.clientY, startPanX: pan.current.tx, startPanY: pan.current.ty };
      velocity.current = { x: 0, y: 0 };
      el!.style.cursor = "grabbing";
      el!.setPointerCapture(e.pointerId);
    }

    function onMove(e: PointerEvent) {
      // Parallax tracking (always)
      if (!transRef.current) {
        mouse.current.x = (e.clientX / window.innerWidth - 0.5) * 2;
        mouse.current.y = (e.clientY / window.innerHeight - 0.5) * 2;
      }

      if (!drag.current.active) return;
      const d = drag.current;
      const dx = e.clientX - d.startX;
      const dy = e.clientY - d.startY;
      const prevTx = pan.current.tx;
      const prevTy = pan.current.ty;
      pan.current.tx = d.startPanX + dx;
      pan.current.ty = d.startPanY + dy;
      velocity.current.x = pan.current.tx - prevTx;
      velocity.current.y = pan.current.ty - prevTy;
    }

    function onUp(e: PointerEvent) {
      if (!drag.current.active) return;
      drag.current.active = false;
      el!.style.cursor = "grab";
      el!.releasePointerCapture(e.pointerId);
    }

    el.style.cursor = "grab";
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointermove", onMove);
    el.addEventListener("pointerup", onUp);
    el.addEventListener("pointercancel", onUp);

    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerup", onUp);
      el.removeEventListener("pointercancel", onUp);
    };
  }, []);

  // --- Double-click → reset ---
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    function onDblClick() {
      zoom.current.target = 1;
      pan.current.tx = 0;
      pan.current.ty = 0;
    }

    el.addEventListener("dblclick", onDblClick);
    return () => el.removeEventListener("dblclick", onDblClick);
  }, []);

  // --- Main RAF loop ---
  useEffect(() => {
    let raf: number;

    function tick() {
      const z = zoom.current;
      const p = pan.current;
      const v = velocity.current;
      const m = mouse.current;
      const isDragging = drag.current.active;
      const isTransitioning = transRef.current;

      // --- Zoom lerp ---
      if (isTransitioning) {
        z.target = CAM.diveZoom;
      }
      z.current += (z.target - z.current) * CAM.zoomLerp;

      // --- Pan: momentum when not dragging ---
      if (!isDragging) {
        p.tx += v.x;
        p.ty += v.y;
        v.x *= CAM.friction;
        v.y *= CAM.friction;
        if (Math.abs(v.x) < 0.1) v.x = 0;
        if (Math.abs(v.y) < 0.1) v.y = 0;
      }

      // Clamp pan to prevent showing edges
      const maxPanX = Math.max(0, (z.current - 1) * window.innerWidth * 0.4);
      const maxPanY = Math.max(0, (z.current - 1) * window.innerHeight * 0.4);
      p.tx = Math.max(-maxPanX, Math.min(maxPanX, p.tx));
      p.ty = Math.max(-maxPanY, Math.min(maxPanY, p.ty));

      // Reset pan on transition
      if (isTransitioning) {
        p.tx *= 0.95;
        p.ty *= 0.95;
      }

      // Lerp actual position
      p.x += (p.tx - p.x) * CAM.panLerp;
      p.y += (p.ty - p.y) * CAM.panLerp;

      // --- Parallax (only when not dragging + not transitioning) ---
      const parallaxActive = !isDragging && !isTransitioning;
      const pt = parallaxActive ? mouse.current : { x: 0, y: 0 };
      m.cx += (pt.x - m.cx) * CAM.parallaxLerp;
      m.cy += (pt.y - m.cy) * CAM.parallaxLerp;

      // --- Blur (transition only) ---
      const blur = isTransitioning
        ? CAM.diveBlur * Math.min(1, (z.current - 1) / (CAM.diveZoom - 1))
        : 0;

      // --- Apply transforms ---
      const pxScene = CAM.parallax.scene;
      const pxStars = CAM.parallax.stars;
      const pxText = CAM.parallax.text;

      if (sceneRef.current) {
        sceneRef.current.style.transform =
          `translate(${p.x + m.cx * pxScene.x}px, ${p.y + m.cy * pxScene.y}px)`;
      }
      if (zoomRef.current) {
        zoomRef.current.style.transform = `scale(${z.current})`;
        zoomRef.current.style.filter = blur > 0.1 ? `blur(${blur.toFixed(1)}px)` : "none";
      }
      if (starsRef.current) {
        starsRef.current.style.transform =
          `translate(${p.x * 0.5 + m.cx * pxStars.x}px, ${p.y * 0.5 + m.cy * pxStars.y}px)`;
      }
      if (textRef.current) {
        textRef.current.style.transform =
          `translate(${m.cx * pxText.x}px, ${m.cy * pxText.y}px)`;
      }

      raf = requestAnimationFrame(tick);
    }

    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative w-full h-screen overflow-hidden select-none touch-none bg-void"
    >
      {/* Scene wrapper — stays at opacity 0 until preloader finishes */}
      <div
        className="absolute inset-0"
        style={{
          opacity: ready ? 1 : 0,
          transition: "opacity 1200ms cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDelay: ready ? "200ms" : "0ms",
        }}
      >
      {/* Scene — pan (outer) + zoom (inner) */}
      <div ref={sceneRef} className="absolute inset-[-40px]">
        <div ref={zoomRef} className="absolute inset-0 origin-center">
          <video
            ref={videoRef}
            autoPlay
            muted
            loop
            playsInline
            preload="auto"
            className="absolute inset-0 w-full h-full object-cover"
            style={{
              filter: "brightness(0.45) saturate(0.4) contrast(1.2) sepia(0.1) hue-rotate(190deg)",
            }}
          >
            <source src="/video/landing-bg-web.mp4" type="video/mp4" />
          </video>

          <div
            className="absolute inset-0"
            style={{
              background: "linear-gradient(180deg, #020810 0%, rgba(5,15,25,0.4) 35%, transparent 55%, rgba(3,8,12,0.6) 80%, #020508 100%)",
            }}
          />

          <div className="absolute bottom-0 left-0 right-0 h-2/5 bg-gradient-to-t from-void/80 to-transparent" />
          <div className="absolute top-0 left-0 right-0 h-1/4 bg-gradient-to-b from-void/60 to-transparent" />

          <div className="grain absolute inset-0" />
          <div className="vignette-heavy absolute inset-0" />
        </div>
      </div>

      {/* Stars — pans at half rate for depth */}
      <div ref={starsRef} className="absolute inset-[-20px]">
        <StarField />
      </div>

      {/* Warm glow */}
      <div
        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[55%] w-[60vw] h-[40vh] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(212, 168, 83, 0.035) 0%, transparent 50%)",
          filter: "blur(80px)",
        }}
      />

      {/* Text — no pan, just parallax */}
      <div
        ref={textRef}
        className="absolute inset-0 flex flex-col items-center justify-center z-10 px-6"
        style={{
          opacity: transitioning ? 0 : 1,
          transition: "opacity 1200ms cubic-bezier(0.4, 0, 1, 1)",
        }}
      >
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
      <div
        className="absolute bottom-5 left-0 right-0 z-10 flex justify-center pointer-events-none"
        style={{ opacity: transitioning ? 0 : 1, transition: "opacity 400ms" }}
      >
        <p className="text-[10px] font-mono text-fog/40 tracking-[0.15em]">
          © 2026 Yunmakai LLC · Solus Records · Lunas Lake Studio
        </p>
      </div>

      {/* Transition fade-to-black */}
      <div
        className="absolute inset-0 bg-void z-20 pointer-events-none"
        style={{
          opacity: transitioning ? 1 : 0,
          transition: "opacity 1500ms cubic-bezier(0.4, 0, 0.2, 1)",
          transitionDelay: transitioning ? "1500ms" : "0ms",
        }}
      />
      </div>
      {/* /Scene wrapper */}

      {/* ------------------------------------------------------------- */}
      {/*  Preloader overlay                                             */}
      {/*  Holds the screen black while BG video buffers, shows a progress */}
      {/*  bar, then fades out as the scene fades in.                     */}
      {/* ------------------------------------------------------------- */}
      <div
        className="absolute inset-0 z-40 bg-void flex flex-col items-center justify-center"
        style={{
          opacity: ready ? 0 : 1,
          transition: "opacity 900ms cubic-bezier(0.4, 0, 0.2, 1)",
          pointerEvents: ready ? "none" : "auto",
        }}
        aria-hidden={ready}
      >
        {/* Faint grain + vignette so the black isn't dead-flat */}
        <div className="grain absolute inset-0 opacity-60" />
        <div className="vignette-heavy absolute inset-0" />

        {/* Center column */}
        <div className="relative flex flex-col items-center gap-10">
          {/* Label above wordmark */}
          <p className="font-mono text-[9px] uppercase tracking-[0.45em] text-fog/40">
            Solus Records
          </p>

          {/* Wordmark — slightly dimmer than the final landing, breathing */}
          <h1 className="font-display text-bone/90 uppercase tracking-[0.4em] text-3xl sm:text-4xl md:text-5xl leading-none animate-breathe">
            Yunmakai
          </h1>

          {/* Thin divider */}
          <div className="w-16 h-px bg-gradient-to-r from-transparent via-amber/40 to-transparent" />

          {/* Progress bar group */}
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-between w-[260px] font-mono text-[9px] tracking-[0.25em] uppercase text-fog/50">
              <span>{ready ? "Signal locked" : "Tuning signal"}</span>
              <span className="tabular-nums text-amber/70">
                {String(Math.round(progress)).padStart(3, "0")}
              </span>
            </div>
            <div className="relative w-[260px] h-px bg-bone/10 overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 bg-amber/80"
                style={{
                  width: `${progress}%`,
                  transition: ready ? "width 420ms cubic-bezier(0.2, 0.7, 0.2, 1)" : "none",
                  boxShadow: "0 0 12px rgba(212, 168, 83, 0.45)",
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
