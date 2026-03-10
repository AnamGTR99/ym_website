"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { useEnvStore } from "@/stores/env";
import HotspotZone, { type HotspotConfig } from "./HotspotZone";
import CreditsOverlay from "./CreditsOverlay";

/* ------------------------------------------------------------------ */
/*  Hotspot definitions — percent-based (x, y, width, height)         */
/*  Desktop positions — will be swapped for mobile layout              */
/* ------------------------------------------------------------------ */

const HOTSPOTS_DESKTOP: HotspotConfig[] = [
  {
    id: "tv",
    label: "TV",
    x: 55,
    y: 25,
    width: 20,
    height: 30,
    color: "#f59e0b", // amber
  },
  {
    id: "credits",
    label: "Credits",
    x: 12,
    y: 30,
    width: 15,
    height: 25,
    color: "#a78bfa", // purple
  },
];

const HOTSPOTS_MOBILE: HotspotConfig[] = [
  {
    id: "tv",
    label: "TV",
    x: 30,
    y: 20,
    width: 40,
    height: 25,
    color: "#f59e0b",
  },
  {
    id: "credits",
    label: "Credits",
    x: 30,
    y: 55,
    width: 40,
    height: 20,
    color: "#a78bfa",
  },
];

/* ------------------------------------------------------------------ */
/*  Room Environment                                                   */
/* ------------------------------------------------------------------ */

export default function RoomEnvironment() {
  const router = useRouter();
  const transitioning = useEnvStore((s) => s.transitioning);
  const startTransition = useEnvStore((s) => s.startTransition);
  const showCredits = useEnvStore((s) => s.showCredits);
  const openCredits = useEnvStore((s) => s.openCredits);

  const handleHotspot = useCallback(
    (id: string) => {
      if (transitioning) return;

      if (id === "tv") {
        startTransition("tv", () => router.push("/tv"));
      } else if (id === "credits") {
        openCredits();
      }
    },
    [transitioning, startTransition, router, openCredits]
  );

  return (
    <div className="relative w-full h-screen overflow-hidden select-none">
      {/* Room background — placeholder gradient until Hugo delivers WEBP */}
      <div className="absolute inset-0">
        {/* When Hugo's room image is ready, replace with:
            <Image
              src="/room-bg.webp"
              alt="Motel room"
              fill
              className="object-cover"
              priority
            />
        */}
        <div className="w-full h-full bg-gradient-to-br from-zinc-950 via-[#0d0f12] to-[#0a0c0e]" />

        {/* Subtle room structure hints — geometric shapes suggesting walls/furniture */}
        <div className="absolute inset-0 opacity-[0.03]">
          {/* Floor line */}
          <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-zinc-800/30 to-transparent" />
          {/* Wall corner */}
          <div className="absolute top-0 left-[40%] w-px h-full bg-gradient-to-b from-zinc-700/20 via-zinc-700/10 to-transparent" />
          {/* Ceiling */}
          <div className="absolute top-0 left-0 right-0 h-[8%] bg-gradient-to-b from-zinc-800/20 to-transparent" />
        </div>

        {/* Ambient warm light spot — as if from a lamp */}
        <div
          className="absolute w-[40%] h-[40%] top-[15%] right-[20%] rounded-full opacity-[0.04]"
          style={{
            background:
              "radial-gradient(ellipse, rgba(251, 191, 36, 0.3) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Atmospheric grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Vignette — darker edges */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 100%)",
        }}
      />

      {/* Desktop hotspots */}
      <div className="hidden md:block absolute inset-0">
        {HOTSPOTS_DESKTOP.map((hotspot) => (
          <HotspotZone
            key={hotspot.id}
            config={hotspot}
            onClick={handleHotspot}
            disabled={transitioning}
          />
        ))}
      </div>

      {/* Mobile hotspots — different positions */}
      <div className="md:hidden absolute inset-0">
        {HOTSPOTS_MOBILE.map((hotspot) => (
          <HotspotZone
            key={hotspot.id}
            config={hotspot}
            onClick={handleHotspot}
            disabled={transitioning}
          />
        ))}
      </div>

      {/* Room label — subtle indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.3em]">
          Motel Room
        </p>
      </div>

      {/* Credits overlay */}
      {showCredits && <CreditsOverlay />}

      {/* Transition overlay — fades to black */}
      <div
        className={`absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-[1200ms] ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
