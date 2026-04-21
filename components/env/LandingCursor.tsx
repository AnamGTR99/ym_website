"use client";

import { useEffect, useRef, useCallback } from "react";

const LINE_COUNT = 6;
const LINE_LENGTH = 30;
const ROTATION_SPEED = 15;

/**
 * Site-wide custom cursor — circle with grain + rotating rays.
 * Native cursor is killed globally via CSS. On clickable elements
 * the dot scales up to signal interactivity.
 */
export default function CustomCursor() {
  const wrapperRef = useRef<HTMLDivElement>(null);
  const dotRef = useRef<HTMLDivElement>(null);
  const mouse = useRef({ x: -100, y: -100 });
  const rendered = useRef({ x: -100, y: -100 });
  const rafId = useRef(0);
  const visibleRef = useRef(false);
  const clickableRef = useRef(false);

  const isClickable = useCallback((target: EventTarget | null): boolean => {
    let el = target as HTMLElement | null;
    while (el && el !== document.documentElement) {
      if (el.tagName === "A" || el.tagName === "BUTTON" || el.tagName === "INPUT" ||
          el.tagName === "SELECT" || el.tagName === "TEXTAREA" || el.tagName === "LABEL" ||
          el.tagName === "SUMMARY" || el.getAttribute("role") === "button" ||
          el.getAttribute("tabindex") !== null ||
          (el.style && el.style.cursor === "pointer")) {
        return true;
      }
      const cs = getComputedStyle(el);
      if (cs.cursor === "pointer") return true;
      el = el.parentElement;
    }
    return false;
  }, []);

  useEffect(() => {
    // Touch device — bail out entirely
    if (window.matchMedia("(pointer: coarse)").matches) return;

    const onMove = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      if (!visibleRef.current) {
        visibleRef.current = true;
        if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
      }
      const hovering = isClickable(e.target);
      if (hovering !== clickableRef.current) {
        clickableRef.current = hovering;
        if (dotRef.current) {
          dotRef.current.style.transform = hovering
            ? "translate(-50%, -50%) scale(1.8)"
            : "translate(-50%, -50%) scale(1)";
        }
      }
    };

    const onLeave = () => {
      visibleRef.current = false;
      if (wrapperRef.current) wrapperRef.current.style.opacity = "0";
    };

    const onEnter = (e: MouseEvent) => {
      mouse.current.x = e.clientX;
      mouse.current.y = e.clientY;
      visibleRef.current = true;
      if (wrapperRef.current) wrapperRef.current.style.opacity = "1";
    };

    const tick = () => {
      rendered.current.x += (mouse.current.x - rendered.current.x) * 0.18;
      rendered.current.y += (mouse.current.y - rendered.current.y) * 0.18;
      if (wrapperRef.current) {
        wrapperRef.current.style.transform =
          `translate(${rendered.current.x}px, ${rendered.current.y}px)`;
      }
      rafId.current = requestAnimationFrame(tick);
    };

    window.addEventListener("mousemove", onMove);
    document.documentElement.addEventListener("mouseleave", onLeave);
    document.documentElement.addEventListener("mouseenter", onEnter);
    rafId.current = requestAnimationFrame(tick);

    return () => {
      window.removeEventListener("mousemove", onMove);
      document.documentElement.removeEventListener("mouseleave", onLeave);
      document.documentElement.removeEventListener("mouseenter", onEnter);
      cancelAnimationFrame(rafId.current);
    };
  }, [isClickable]);

  const rays = Array.from({ length: LINE_COUNT }, (_, i) => (360 / LINE_COUNT) * i);

  return (
    <>
      {/* cursor: none lives in globals.css so it loads before JS */}
      <style>{`
        @keyframes ymCursorSpin {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ymCursorPulse {
          0%, 100% { opacity: 0.35; }
          50%      { opacity: 0.55; }
        }
      `}</style>

      <div
        ref={wrapperRef}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          zIndex: 9999,
          pointerEvents: "none",
          opacity: 0,
          mixBlendMode: "difference",
          willChange: "transform",
        }}
      >
        <div
          ref={dotRef}
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            transform: "translate(-50%, -50%) scale(1)",
            transition: "transform 200ms cubic-bezier(0.22, 1, 0.36, 1)",
          }}
        >
          {/* Rotating rays */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              width: 0,
              height: 0,
              animation: `ymCursorSpin ${ROTATION_SPEED}s linear infinite`,
            }}
          >
            {rays.map((deg) => (
              <div
                key={deg}
                style={{
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "1px",
                  height: `${LINE_LENGTH}px`,
                  transformOrigin: "0 0",
                  transform: `rotate(${deg}deg)`,
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.45) 0%, rgba(255,255,255,0.08) 60%, transparent 100%)",
                  animation: `ymCursorPulse ${3 + (deg % 3)}s ease-in-out infinite`,
                }}
              />
            ))}
          </div>

          {/* Central circle */}
          <div
            style={{
              position: "relative",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: "rgba(255, 255, 255, 0.85)",
              boxShadow: "0 0 6px rgba(255,255,255,0.25)",
            }}
          >
            <svg
              width="10"
              height="10"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                borderRadius: "50%",
                overflow: "hidden",
                opacity: 0.5,
                mixBlendMode: "overlay",
              }}
            >
              <defs>
                <filter id="cursorGrain">
                  <feTurbulence
                    type="fractalNoise"
                    baseFrequency="0.9"
                    numOctaves="4"
                    stitchTiles="stitch"
                  />
                  <feColorMatrix type="saturate" values="0" />
                </filter>
              </defs>
              <rect
                width="10"
                height="10"
                filter="url(#cursorGrain)"
                opacity="1"
              />
            </svg>
          </div>
        </div>
      </div>
    </>
  );
}
