"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useEnvStore } from "@/stores/env";
import { useFocusTrap } from "@/hooks/useFocusTrap";

/* ------------------------------------------------------------------ */
/*  Credits back button — same visual language as the in-room one      */
/* ------------------------------------------------------------------ */

function CreditsBackButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: "fixed",
        top: "1.4rem",
        left: "1.4rem",
        zIndex: 10000,
        background: hovered ? "rgba(10,10,10,0.75)" : "rgba(0,0,0,0.55)",
        border: `1px solid ${hovered ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.18)"}`,
        borderRadius: "2px",
        color: hovered ? "rgba(255,255,255,0.9)" : "rgba(232,224,200,0.8)",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        fontWeight: 500,
        letterSpacing: "0.28em",
        textTransform: "uppercase",
        padding: "9px 16px 9px 14px",
        cursor: "pointer",
        backdropFilter: "blur(6px)",
        transition: "all 200ms ease",
        display: "inline-flex",
        alignItems: "center",
        gap: "10px",
        boxShadow: hovered
          ? "0 0 22px rgba(255,255,255,0.12), inset 0 0 12px rgba(255,255,255,0.03)"
          : "0 0 14px rgba(0,0,0,0.5)",
      }}
    >
      <span style={{ fontSize: "11px" }}>←</span>
      <span>Back</span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/*  Credits content — movie-style rolling credits                      */
/* ------------------------------------------------------------------ */

interface CreditEntry {
  type: "title" | "subtitle" | "section" | "role" | "cast" | "spacer" | "divider";
  text?: string;
  name?: string;
}

const CREDITS: CreditEntry[] = [
  // Title card
  { type: "spacer" },
  { type: "spacer" },
  { type: "title", text: "YUNMAKAI" },
  { type: "subtitle", text: "A Solus Records Production" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "divider" },
  { type: "spacer" },

  // Key credits
  { type: "role", text: "Music By" },
  { type: "cast", text: "Yunmakai" },
  { type: "spacer" },
  { type: "role", text: "Executive Producer" },
  { type: "cast", text: "Solus Records" },
  { type: "spacer" },
  { type: "divider" },
  { type: "spacer" },

  // Technical credits
  { type: "section", text: "TECHNICAL CREW" },
  { type: "spacer" },
  { type: "role", text: "Lead Developer", name: "Anam" },
  { type: "role", text: "3D Environment Artist", name: "Brwski" },
  { type: "role", text: "Platform Architecture", name: "Anam" },
  { type: "role", text: "UI / UX Design", name: "Anam" },
  { type: "spacer" },
  { type: "divider" },
  { type: "spacer" },

  // Platform
  { type: "section", text: "PLATFORM" },
  { type: "spacer" },
  { type: "role", text: "Framework", name: "Next.js" },
  { type: "role", text: "Commerce", name: "Shopify Storefront API" },
  { type: "role", text: "Authentication", name: "Supabase" },
  { type: "role", text: "3D Rendering", name: "React Three Fiber" },
  { type: "role", text: "Hosting", name: "Vercel" },
  { type: "spacer" },
  { type: "divider" },
  { type: "spacer" },

  // Special thanks
  { type: "section", text: "SPECIAL THANKS" },
  { type: "spacer" },
  { type: "cast", text: "Lunas Lake Studio" },
  { type: "cast", text: "Yunmakai LLC" },
  { type: "spacer" },
  { type: "spacer" },

  // Closing
  { type: "divider" },
  { type: "spacer" },
  { type: "title", text: "YUNMAKAI" },
  { type: "subtitle", text: "yunmakai.myshopify.com" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "spacer" },
  { type: "spacer" },
];

/* ------------------------------------------------------------------ */
/*  Credits Overlay                                                    */
/* ------------------------------------------------------------------ */

interface CreditsOverlayProps {
  onClose?: () => void;
}

export default function CreditsOverlay({ onClose }: CreditsOverlayProps) {
  const closeCredits = useEnvStore((s) => s.closeCredits);
  const [closing, setClosing] = useState(false);
  const overlayRef = useFocusTrap<HTMLDivElement>(true);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const handleClose = useCallback(() => {
    setClosing(true);
    closeTimerRef.current = setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        closeCredits();
      }
    }, 600);
  }, [closeCredits, onClose]);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);



  return (
    <div
      ref={overlayRef}
      className={`fixed inset-0 z-30 overflow-hidden transition-opacity duration-600 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Credits"
    >
      {/* Background — bayou video */}
      <div className="absolute inset-0 bg-void">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover opacity-40"
          style={{ filter: "brightness(0.95) saturate(0.4)" }}
        >
          <source src="/video/bayou-bg-web.mp4" type="video/mp4" />
        </video>
        {/* Dark overlay for text readability */}
        <div className="absolute inset-0 bg-gradient-to-b from-void/70 via-void/40 to-void/70" />
      </div>

      {/* Film grain + vignette */}
      <div className="grain absolute inset-0" />
      <div className="vignette absolute inset-0" />

      {/* Scrolling credits container */}
      <div className="absolute inset-0 flex justify-center overflow-hidden">
        <div
          className="credits-scroll flex flex-col items-center w-full max-w-2xl px-8"
          style={{
            animation: "creditsScroll 45s linear infinite",
          }}
        >
          {/* Top padding — start credits from ~40% down viewport */}
          <div className="h-[40vh] flex-shrink-0" />

          {CREDITS.map((entry, i) => {
            switch (entry.type) {
              case "title":
                return (
                  <h1
                    key={i}
                    className="text-4xl sm:text-5xl md:text-6xl font-bold uppercase tracking-[0.3em] text-bone/90 text-center py-2 select-none"
                  >
                    {entry.text}
                  </h1>
                );
              case "subtitle":
                return (
                  <p
                    key={i}
                    className="text-xs sm:text-sm font-mono tracking-[0.2em] text-fog text-center py-1 select-none"
                  >
                    {entry.text}
                  </p>
                );
              case "section":
                return (
                  <h2
                    key={i}
                    className="text-label text-bone/60 text-center py-2 select-none"
                  >
                    {entry.text}
                  </h2>
                );
              case "role":
                return entry.name ? (
                  <div
                    key={i}
                    className="w-full flex items-baseline justify-center gap-4 py-1.5 select-none"
                  >
                    <span className="text-xs sm:text-sm font-mono text-fog text-right flex-1">
                      {entry.text}
                    </span>
                    <span className="text-xs text-ash mx-1">{"· · ·"}</span>
                    <span className="text-sm sm:text-base font-semibold text-bone text-left flex-1">
                      {entry.name}
                    </span>
                  </div>
                ) : (
                  <p
                    key={i}
                    className="text-xs sm:text-sm font-mono text-fog text-center py-1 select-none"
                  >
                    {entry.text}
                  </p>
                );
              case "cast":
                return (
                  <p
                    key={i}
                    className="text-lg sm:text-xl font-light tracking-wider text-bone text-center py-1 select-none"
                  >
                    {entry.text}
                  </p>
                );
              case "divider":
                return (
                  <div
                    key={i}
                    className="w-16 h-px bg-gradient-to-r from-transparent via-bone/25 to-transparent my-4"
                  />
                );
              case "spacer":
                return <div key={i} className="h-8 flex-shrink-0" />;
              default:
                return null;
            }
          })}

          {/* Bottom padding so credits scroll fully out before looping */}
          <div className="h-screen flex-shrink-0" />
        </div>
      </div>


      {/* Back button — matches the MotelRoomScene BackButton style */}
      <CreditsBackButton onClick={handleClose} />

      {/* CSS animations */}
      <style>{`
        @keyframes creditsScroll {
          0% { transform: translateY(0); }
          100% { transform: translateY(-100%); }
        }
        .credits-scroll:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
