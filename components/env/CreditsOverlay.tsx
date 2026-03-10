"use client";

import { useCallback, useEffect, useState } from "react";
import { useEnvStore } from "@/stores/env";

/* ------------------------------------------------------------------ */
/*  Placeholder credits — replace with real content from Yunmakai      */
/* ------------------------------------------------------------------ */

interface CreditLine {
  text: string;
  type: "title" | "role" | "name" | "spacer";
}

const CREDITS: CreditLine[] = [
  { text: "Yunmakai", type: "title" },
  { text: "", type: "spacer" },
  { text: "Music By", type: "role" },
  { text: "Yunmakai", type: "name" },
  { text: "", type: "spacer" },
  { text: "Design", type: "role" },
  { text: "Hugo", type: "name" },
  { text: "", type: "spacer" },
  { text: "Development", type: "role" },
  { text: "Anam", type: "name" },
  { text: "", type: "spacer" },
  { text: "Special Thanks", type: "role" },
  { text: "Coming Soon", type: "name" },
];

const LINE_DELAY = 400; // ms between each line appearing

/* ------------------------------------------------------------------ */
/*  Credits Overlay                                                    */
/* ------------------------------------------------------------------ */

interface CreditsOverlayProps {
  /** Optional override for close behavior (e.g. navigate back on standalone route) */
  onClose?: () => void;
}

export default function CreditsOverlay({ onClose }: CreditsOverlayProps) {
  const closeCredits = useEnvStore((s) => s.closeCredits);
  const [visibleLines, setVisibleLines] = useState(0);
  const [closing, setClosing] = useState(false);

  // Animate lines appearing one by one
  useEffect(() => {
    if (visibleLines >= CREDITS.length) return;

    const timer = setTimeout(() => {
      setVisibleLines((prev) => prev + 1);
    }, LINE_DELAY);

    return () => clearTimeout(timer);
  }, [visibleLines]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      if (onClose) {
        onClose();
      } else {
        closeCredits();
      }
    }, 600);
  }, [closeCredits, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [handleClose]);

  return (
    <div
      className={`fixed inset-0 z-30 flex items-center justify-center transition-opacity duration-600 ${
        closing ? "opacity-0" : "opacity-100"
      }`}
      role="dialog"
      aria-label="Credits"
    >
      {/* Background — water visual placeholder */}
      <div className="absolute inset-0">
        {/* When Hugo delivers water/lake visual, replace with:
            <video
              autoPlay muted loop playsInline
              className="w-full h-full object-cover"
            >
              <source src="/credits-bg.mp4" type="video/mp4" />
            </video>
        */}
        <div className="w-full h-full bg-gradient-to-b from-[#030508] via-[#060a10] to-[#0a1018]" />

        {/* Water-like ripple effect — CSS only */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            background:
              "repeating-linear-gradient(0deg, transparent, transparent 40px, rgba(100, 150, 200, 0.08) 40px, rgba(100, 150, 200, 0.08) 41px)",
            animation: "creditsRipple 8s linear infinite",
          }}
        />
      </div>

      {/* Grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: "200px 200px",
        }}
      />

      {/* Credits text */}
      <div className="relative z-10 flex flex-col items-center gap-1 px-6 max-w-lg">
        {CREDITS.map((line, i) => {
          if (line.type === "spacer") {
            return (
              <div
                key={i}
                className="h-8 transition-opacity duration-700"
                style={{ opacity: i < visibleLines ? 1 : 0 }}
              />
            );
          }

          const baseClasses =
            "transition-all duration-700 text-center select-none";
          const visible = i < visibleLines;

          const typeStyles = {
            title:
              "text-3xl sm:text-5xl md:text-6xl font-bold uppercase tracking-[0.3em] text-white/90",
            role: "text-[10px] sm:text-xs font-mono uppercase tracking-[0.25em] text-zinc-500",
            name: "text-lg sm:text-xl md:text-2xl font-light tracking-wider text-zinc-300",
          };

          return (
            <p
              key={i}
              className={`${baseClasses} ${typeStyles[line.type]}`}
              style={{
                opacity: visible ? 1 : 0,
                transform: visible
                  ? "translateY(0)"
                  : "translateY(12px)",
              }}
            >
              {line.text}
            </p>
          );
        })}
      </div>

      {/* Close button */}
      <button
        onClick={handleClose}
        className="absolute top-6 right-6 z-20 text-zinc-600 hover:text-white transition-colors duration-300 p-2"
        aria-label="Close credits"
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
        >
          <path d="M18 6L6 18M6 6l12 12" />
        </svg>
      </button>

      {/* Dismiss hint */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10">
        <p className="text-[10px] font-mono text-zinc-600 uppercase tracking-[0.2em]">
          Esc to close
        </p>
      </div>

      {/* CSS animation for water ripple */}
      <style jsx>{`
        @keyframes creditsRipple {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 0 80px;
          }
        }
      `}</style>
    </div>
  );
}
