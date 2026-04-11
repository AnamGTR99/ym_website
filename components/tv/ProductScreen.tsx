"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";

const ModelViewer = dynamic(() => import("@/components/three/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-ash border-t-bone rounded-full animate-spin" />
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
  const [mode, setMode] = useState<"photo" | "3d">("photo");

  const currentImage = images[activeIndex] ?? null;

  return (
    <div className="scanlines flex-1 bg-soot flex flex-col min-h-[400px] md:min-h-[500px] relative">
      {/* Main display area */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        {mode === "photo" ? (
          currentImage ? (
            <Image
              src={currentImage.url}
              alt={currentImage.altText ?? title}
              fill
              sizes="(max-width: 768px) 100vw, 60vw"
              className="object-contain"
              priority
            />
          ) : (
            <div className="text-ash text-sm font-mono">
              No image available
            </div>
          )
        ) : glbUrl ? (
          <ModelViewer
            src={glbUrl}
            poster={currentImage?.url}
            alt={`${title} 3D model`}
          />
        ) : (
          <div className="text-ash text-sm font-mono">
            No 3D model available
          </div>
        )}
      </div>

      {/* Bottom bar: thumbnails + mode toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-charcoal relative z-10">
        {/* Image thumbnails */}
        <div className="flex gap-1.5 overflow-x-auto">
          {images.map((img, i) => (
            <button
              key={img.id ?? i}
              onClick={() => {
                setActiveIndex(i);
                setMode("photo");
              }}
              className={`w-10 h-10 flex-shrink-0 rounded overflow-hidden border transition-colors ${
                activeIndex === i && mode === "photo"
                  ? "border-amber"
                  : "border-ash hover:border-fog"
              }`}
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

        {/* Mode toggle */}
        <div className="flex gap-1.5 ml-3">
          <button
            onClick={() => setMode("photo")}
            className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
              mode === "photo"
                ? "border-amber text-amber"
                : "border-ash text-fog hover:border-fog"
            }`}
          >
            Photo
          </button>
          {glbUrl && (
            <button
              onClick={() => setMode("3d")}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                mode === "3d"
                  ? "border-teal text-teal"
                  : "border-ash text-fog hover:border-fog"
              }`}
            >
              3D
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
