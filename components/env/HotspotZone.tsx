"use client";

import { useCallback, useState } from "react";

export interface HotspotConfig {
  /** Unique identifier */
  id: string;
  /** Display label shown on hover */
  label: string;
  /** Percent-based position and size (0–100) */
  x: number;
  y: number;
  width: number;
  height: number;
  /** Accent color for glow effect */
  color: string;
}

interface HotspotZoneProps {
  config: HotspotConfig;
  onClick: (id: string) => void;
  disabled?: boolean;
}

export default function HotspotZone({
  config,
  onClick,
  disabled,
}: HotspotZoneProps) {
  const [hovered, setHovered] = useState(false);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick(config.id);
  }, [disabled, onClick, config.id]);

  return (
    <button
      onClick={handleClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      aria-label={`Navigate to ${config.label}`}
      className="absolute cursor-pointer border-0 bg-transparent p-0 transition-all duration-500 group focus:outline-none focus-visible:ring-2 focus-visible:ring-white/50 rounded-md"
      style={{
        left: `${config.x}%`,
        top: `${config.y}%`,
        width: `${config.width}%`,
        height: `${config.height}%`,
      }}
    >
      {/* Hotspot boundary — subtle dashed outline, glows on hover */}
      <div
        className="absolute inset-0 rounded-md border border-dashed transition-all duration-500"
        style={{
          borderColor: hovered
            ? config.color
            : `color-mix(in srgb, ${config.color} 30%, transparent)`,
          boxShadow: hovered
            ? `0 0 30px ${config.color}40, inset 0 0 20px ${config.color}15`
            : "none",
          backgroundColor: hovered ? `${config.color}08` : "transparent",
        }}
      />

      {/* Pulse dot — always visible, pulses to draw attention */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
        <div
          className="w-2 h-2 rounded-full animate-pulse"
          style={{ backgroundColor: config.color, opacity: hovered ? 1 : 0.5 }}
        />
        <div
          className="absolute inset-0 w-2 h-2 rounded-full animate-ping"
          style={{
            backgroundColor: config.color,
            opacity: hovered ? 0.4 : 0.15,
          }}
        />
      </div>

      {/* Label — appears on hover */}
      <div
        className="absolute left-1/2 -translate-x-1/2 -bottom-7 whitespace-nowrap transition-all duration-300 pointer-events-none"
        style={{
          opacity: hovered ? 1 : 0,
          transform: `translateX(-50%) translateY(${hovered ? "0" : "4px"})`,
        }}
      >
        <span
          className="text-[10px] sm:text-xs font-mono uppercase tracking-widest px-2 py-1 rounded"
          style={{
            color: config.color,
            backgroundColor: `${config.color}15`,
          }}
        >
          {config.label}
        </span>
      </div>
    </button>
  );
}
