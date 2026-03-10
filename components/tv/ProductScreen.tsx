"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import Image from "next/image";
import type { ShopifyImage } from "@/lib/shopify/types";

const ModelViewer = dynamic(() => import("@/components/three/ModelViewer"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-full flex items-center justify-center">
      <div className="w-6 h-6 border-2 border-zinc-600 border-t-white rounded-full animate-spin" />
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
    <div className="flex-1 bg-zinc-950 flex flex-col min-h-[400px] md:min-h-[500px]">
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
            <div className="text-zinc-700 text-sm font-mono">
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
          <div className="text-zinc-700 text-sm font-mono">
            No 3D model available
          </div>
        )}
      </div>

      {/* Bottom bar: thumbnails + mode toggle */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
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
                  ? "border-white"
                  : "border-zinc-700 hover:border-zinc-500"
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
                ? "border-white text-white"
                : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
            }`}
          >
            Photo
          </button>
          {glbUrl && (
            <button
              onClick={() => setMode("3d")}
              className={`px-3 py-1 text-xs font-mono rounded border transition-colors ${
                mode === "3d"
                  ? "border-purple-500 text-purple-400"
                  : "border-zinc-700 text-zinc-500 hover:border-zinc-500"
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
