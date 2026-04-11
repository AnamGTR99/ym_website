"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";

const TVRoomScene = dynamic(() => import("@/components/three/TVRoomScene"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="flex flex-col items-center gap-3">
        <div className="w-6 h-6 border-2 border-ash border-t-amber rounded-full animate-spin" />
        <p className="text-xs font-mono text-fog tracking-[0.15em] uppercase">
          Tuning signal…
        </p>
      </div>
    </div>
  ),
});

interface ProductScreenProps {
  images: ShopifyImage[];
  title: string;
  glbUrl: string | null;
}

export default function ProductScreen({
  images,
  title,
  glbUrl,
}: ProductScreenProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [mode, setMode] = useState<"tv" | "photo">("tv");

  const currentImage = images[activeIndex] ?? null;

  return (
    <div className="scanlines flex-1 bg-void flex flex-col min-h-[400px] md:min-h-[500px] relative">
      {/* Main display area */}
      <div className="flex-1 relative overflow-hidden">
        {mode === "tv" ? (
          <TVRoomScene
            productImageUrl={currentImage?.url ?? null}
            glbUrl={glbUrl}
          />
        ) : currentImage ? (
          <Image
            src={currentImage.url}
            alt={currentImage.altText ?? title}
            fill
            sizes="(max-width: 768px) 100vw, 60vw"
            className="object-contain"
            priority
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-ash text-sm font-mono">No image available</p>
          </div>
        )}
      </div>

      {/* Bottom bar: thumbnails + mode toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-charcoal relative z-10 bg-void/80 backdrop-blur-sm">
        {/* Image thumbnails — click to switch channel */}
        <div className="flex gap-1.5 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => setActiveIndex(i)}
              className={`w-10 h-10 flex-shrink-0 rounded-sm overflow-hidden border transition-colors ${
                activeIndex === i
                  ? "border-amber"
                  : "border-ash hover:border-fog"
              }`}
              aria-label={`View image ${i + 1}`}
            >
              <Image
                src={img.url}
                alt={img.altText ?? `${title} ${i + 1}`}
                width={40}
                height={40}
                className="w-full h-full object-cover"
              />
            </button>
          ))}
        </div>

        {/* Mode toggle — TV / Photo */}
        <div className="flex gap-1.5 ml-3">
          <button
            onClick={() => setMode("tv")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-colors uppercase tracking-[0.1em] ${
              mode === "tv"
                ? "border-amber text-amber"
                : "border-ash text-fog hover:border-fog"
            }`}
          >
            TV
          </button>
          <button
            onClick={() => setMode("photo")}
            className={`px-3 py-1 text-xs font-mono rounded-sm border transition-colors uppercase tracking-[0.1em] ${
              mode === "photo"
                ? "border-teal text-teal"
                : "border-ash text-fog hover:border-fog"
            }`}
          >
            Photo
          </button>
        </div>
      </div>
    </div>
  );
}
