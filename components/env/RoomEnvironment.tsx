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
        <div className="w-full h-full bg-gradient-to-br from-void via-abyss to-void" />

        {/* Subtle room structure hints — geometric shapes suggesting walls/furniture */}
        <div className="absolute inset-0 opacity-[0.03]">
          {/* Floor line */}
          <div className="absolute bottom-0 left-0 right-0 h-[35%] bg-gradient-to-t from-charcoal/30 to-transparent" />
          {/* Wall corner */}
          <div className="absolute top-0 left-[40%] w-px h-full bg-gradient-to-b from-ash/20 via-ash/10 to-transparent" />
          {/* Ceiling */}
          <div className="absolute top-0 left-0 right-0 h-[8%] bg-gradient-to-b from-charcoal/20 to-transparent" />
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

      {/* Atmospheric grain + vignette overlays */}
      <div className="grain absolute inset-0" />
      <div className="vignette absolute inset-0" />

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
        <p className="text-label text-smoke">
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
