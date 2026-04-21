"use client";

import { useEffect, useRef, useState } from "react";

type Phase = "loading" | "static" | "ready" | "hidden";

/**
 * VHS tuning-signal transition overlay — reusable across pages.
 * Shows "TUNING SIGNAL..." with scanlines and tracking bars.
 * Waits for `ready` prop to become true, then exits with a brief
 * static noise burst and fade.
 */
export default function VHSTransition({ ready }: { ready: boolean }) {
  const [phase, setPhase] = useState<Phase>("loading");
  const readyAt = useRef<number | null>(null);

  useEffect(() => {
    if (!ready || phase !== "loading") return;
    if (!readyAt.current) readyAt.current = performance.now();

    const settleDelay = setTimeout(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setPhase("static");
          setTimeout(() => {
            setPhase("ready");
            setTimeout(() => setPhase("hidden"), 1200);
          }, 300);
        });
      });
    }, 400);

    return () => clearTimeout(settleDelay);
  }, [ready, phase]);

  // Hard fallback: after 10s, force exit
  useEffect(() => {
    if (phase !== "loading") return;
    const fallback = setTimeout(() => {
      setPhase("static");
      setTimeout(() => {
        setPhase("ready");
        setTimeout(() => setPhase("hidden"), 1200);
      }, 300);
    }, 10000);
    return () => clearTimeout(fallback);
  }, [phase]);

  if (phase === "hidden") return null;

  const isStatic = phase === "static";

  return (
    <div
      aria-hidden="true"
      className={`fixed inset-0 z-[60] bg-void pointer-events-none transition-opacity ease-[cubic-bezier(0.22,1,0.36,1)] ${
        phase === "ready"
          ? "opacity-0 duration-[1200ms]"
          : "opacity-100 duration-0"
      }`}
    >
      <div className="grain absolute inset-0" style={{ opacity: 0.04 }} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "repeating-linear-gradient(0deg, transparent 0px, transparent 2px, rgba(255,255,255,0.02) 2px, rgba(255,255,255,0.02) 4px)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          height: "3px",
          background:
            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.06) 30%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.06) 70%, transparent 100%)",
          filter: "blur(1px)",
          animation: "vhsTransTracking 5s linear infinite",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          boxShadow:
            "inset 0 0 120px rgba(0,0,0,0.5), inset 0 0 40px rgba(0,0,0,0.3)",
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: isStatic ? 0.3 : 0.02,
          transition: isStatic ? "none" : "opacity 200ms ease",
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect fill='white' width='2' height='2'/%3E%3C/svg%3E\")",
          backgroundSize: "4px 4px",
          animation: "vhsTransNoise 0.1s steps(5) infinite",
          mixBlendMode: "overlay" as const,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "24px",
          opacity: isStatic ? 0.1 : 1,
          transition: isStatic ? "opacity 100ms ease" : "none",
        }}
      >
        <div
          style={{
            fontFamily: "'Courier New', monospace",
            fontSize: "13px",
            fontWeight: 500,
            letterSpacing: "0.35em",
            textTransform: "uppercase",
            color: ready
              ? "rgba(224, 224, 224, 0.7)"
              : "rgba(200, 192, 168, 0.4)",
            textShadow: ready
              ? "0 0 12px rgba(224, 224, 224, 0.15)"
              : "none",
            transition: "color 300ms ease, text-shadow 300ms ease",
          }}
        >
          {ready ? "SIGNAL LOCKED" : "TUNING SIGNAL"}
        </div>

        <div
          style={{
            width: "220px",
            display: "flex",
            flexDirection: "column",
            gap: "10px",
            alignItems: "center",
          }}
        >
          <div
            style={{
              width: "100%",
              height: "1px",
              background: "rgba(224, 224, 224, 0.08)",
              overflow: "hidden",
              position: "relative",
            }}
          >
            {!ready ? (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  width: "33%",
                  background: "rgba(224, 224, 224, 0.4)",
                  animation: "vhsTransSweep 1.8s ease-in-out infinite",
                }}
              />
            ) : (
              <div
                style={{
                  height: "100%",
                  background: "rgba(224, 224, 224, 0.5)",
                  width: "100%",
                  transition: "width 300ms ease-out",
                  boxShadow: "0 0 8px rgba(224, 224, 224, 0.2)",
                }}
              />
            )}
          </div>
        </div>
      </div>

      <style>{`
        @keyframes vhsTransTracking {
          0% { top: -3px; }
          100% { top: 100%; }
        }
        @keyframes vhsTransNoise {
          0% { transform: translate(0, 0); }
          25% { transform: translate(-1px, 1px); }
          50% { transform: translate(1px, -1px); }
          75% { transform: translate(-1px, -1px); }
          100% { transform: translate(0, 0); }
        }
        @keyframes vhsTransSweep {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
      `}</style>
    </div>
  );
}
