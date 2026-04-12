"use client";

import { useEffect, useState } from "react";
import { useProgress } from "@react-three/drei";

type Status = "idle" | "loading" | "ready" | "hidden";

/**
 * Top-right loading readout for the R3F scene.
 * Reads from drei's useProgress (wraps Three's DefaultLoadingManager)
 * so it picks up GLB, texture, and any other loader progress.
 *
 * Shows:
 *  - Percent + items loaded while active
 *  - Current loader item (mesh/texture name) for debug visibility
 *  - "READY" confirmation for 3 seconds after completion, then hides
 */
export default function LoadingOverlay() {
  const { active, progress, loaded, total, item } = useProgress();
  const [status, setStatus] = useState<Status>("idle");
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [elapsedMs, setElapsedMs] = useState<number | null>(null);

  useEffect(() => {
    if (active) {
      setStatus("loading");
      if (!startedAt) setStartedAt(Date.now());
    } else if (!active && status === "loading") {
      setStatus("ready");
      if (startedAt) setElapsedMs(Date.now() - startedAt);
      const t = setTimeout(() => setStatus("hidden"), 4000);
      return () => clearTimeout(t);
    }
  }, [active, status, startedAt]);

  if (status === "idle" || status === "hidden") return null;

  return (
    <div className="fixed top-4 right-4 z-[60] pointer-events-none font-mono select-none">
      <div className="bg-abyss/85 backdrop-blur-sm border border-charcoal rounded px-3 py-2 min-w-[180px] shadow-deep">
        {status === "loading" ? (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-amber tracking-[0.2em] uppercase">
                Loading
              </p>
              <p className="text-[10px] text-bone tabular-nums">
                {progress.toFixed(0)}%
              </p>
            </div>
            <div className="w-full h-[2px] bg-charcoal mt-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber transition-[width] duration-150"
                style={{ width: `${progress}%` }}
              />
            </div>
            <p className="text-[10px] text-fog mt-2 tabular-nums">
              {loaded}/{total} assets
            </p>
            {item && (
              <p className="text-[9px] text-smoke mt-1 truncate max-w-[260px]">
                {item.split("/").pop()}
              </p>
            )}
          </>
        ) : (
          <>
            <div className="flex items-center justify-between gap-3">
              <p className="text-[10px] text-teal tracking-[0.2em] uppercase">
                Ready
              </p>
              {elapsedMs !== null && (
                <p className="text-[10px] text-bone tabular-nums">
                  {(elapsedMs / 1000).toFixed(1)}s
                </p>
              )}
            </div>
            <p className="text-[10px] text-fog mt-1 tabular-nums">
              {loaded} assets loaded
            </p>
          </>
        )}
      </div>
    </div>
  );
}
