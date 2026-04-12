"use client";

import { useEffect, useRef, useState } from "react";

interface ModelViewerProps {
  src: string;
  poster?: string;
  alt?: string;
}

export default function ModelViewer({ src, poster, alt }: ModelViewerProps) {
  const viewerRef = useRef<HTMLElement>(null);
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Dynamically import model-viewer (web component, SSR-incompatible)
  useEffect(() => {
    import("@google/model-viewer").catch(() => {
      setError(true);
    });
  }, []);

  // Bind web component events via ref (React doesn't forward custom events)
  useEffect(() => {
    const el = viewerRef.current;
    if (!el) return;

    console.log("[ModelViewer] Loading model:", src);
    const t0 = performance.now();

    const onLoad = () => {
      console.log(
        `[ModelViewer] Model loaded in ${(performance.now() - t0).toFixed(0)}ms — ${src}`
      );
      setLoaded(true);
    };
    const onError = () => {
      console.warn("[ModelViewer] Failed to load model:", src);
      setError(true);
    };

    el.addEventListener("load", onLoad);
    el.addEventListener("error", onError);

    return () => {
      el.removeEventListener("load", onLoad);
      el.removeEventListener("error", onError);
    };
  }, [src]);

  return (
    <div className="w-full h-full relative">
      {/* Loading state */}
      {!loaded && !error && (
        <div className="absolute inset-0 flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
            <p className="text-xs font-mono text-zinc-500">
              Loading 3D model...
            </p>
          </div>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <p className="text-xs font-mono text-zinc-500">
            Failed to load 3D model
          </p>
        </div>
      )}

      {/* model-viewer web component */}
      {!error && (
        <model-viewer
          ref={viewerRef}
          src={src}
          poster={poster}
          alt={alt ?? "3D product model"}
          auto-rotate
          camera-controls
          touch-action="pan-y"
          interaction-prompt="none"
          shadow-intensity="0.5"
          style={{ width: "100%", height: "100%" }}
        />
      )}
    </div>
  );
}
