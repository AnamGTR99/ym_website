"use client";

import { useCallback } from "react";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useEnvStore } from "@/stores/env";
import HotspotZone, { type HotspotConfig } from "./HotspotZone";
import CreditsOverlay from "./CreditsOverlay";

const MotelRoomScene = dynamic(() => import("@/components/three/MotelRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full bg-gradient-to-br from-void via-abyss to-void flex items-center justify-center">
      <p className="text-label text-fog animate-pulse">Entering the room…</p>
    </div>
  ),
});

/* ------------------------------------------------------------------ */
/*  Mobile fallback hotspots — 2D, percent-positioned                 */
/*  Used on touch devices where R3F orbit ergonomics are painful.     */
/* ------------------------------------------------------------------ */

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
      {/* Desktop / tablet — full R3F scene */}
      <div className="hidden md:block absolute inset-0">
        <MotelRoomScene />
      </div>

      {/* Mobile fallback — 2D hotspots over static gradient */}
      <div className="md:hidden absolute inset-0">
        <div className="w-full h-full bg-gradient-to-br from-void via-abyss to-void" />
        <div className="absolute inset-0">
          {HOTSPOTS_MOBILE.map((hotspot) => (
            <HotspotZone
              key={hotspot.id}
              config={hotspot}
              onClick={handleHotspot}
              disabled={transitioning}
            />
          ))}
        </div>
      </div>

      {/* Atmospheric overlays — stack over canvas for brand consistency */}
      <div className="grain absolute inset-0 pointer-events-none" />
      <div className="vignette absolute inset-0 pointer-events-none" />

      {/* Room label */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 pointer-events-none">
        <p className="text-label text-smoke">Motel Room</p>
      </div>

      {/* Credits overlay */}
      {showCredits && <CreditsOverlay />}

      {/* Transition fade-to-black */}
      <div
        className={`absolute inset-0 bg-black z-20 pointer-events-none transition-opacity duration-[1200ms] ${
          transitioning ? "opacity-100" : "opacity-0"
        }`}
      />
    </div>
  );
}
