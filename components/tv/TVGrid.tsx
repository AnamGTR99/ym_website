"use client";

import { useState, useMemo } from "react";
import TVCard from "./TVCard";
import type { ShopifyProduct } from "@/lib/shopify/types";

interface TVGridProps {
  products: ShopifyProduct[];
}

export default function TVGrid({ products }: TVGridProps) {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search.trim()) return products;
    const q = search.toLowerCase();
    return products.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.productType.toLowerCase().includes(q) ||
        p.tags.some((t) => t.toLowerCase().includes(q))
    );
  }, [products, search]);

  return (
    <div className="flex flex-col md:flex-row w-full border border-zinc-800 rounded-xl overflow-hidden">
      {/* TV Screen — Channel Grid */}
      <div className="flex-1 bg-zinc-950 p-5 md:p-6 flex flex-col gap-4">
        {/* Screen header */}
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
            {filtered.length} Channel{filtered.length !== 1 ? "s" : ""}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-[10px] font-mono text-zinc-500 hover:text-white transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {filtered.map((product, i) => (
              <TVCard key={product.id} product={product} channelNumber={i + 1} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[300px]">
            <div className="text-center">
              <p className="text-zinc-600 text-sm font-mono">No channels found</p>
              {search && (
                <p className="text-zinc-700 text-xs font-mono mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TV Controls Panel */}
      <div className="w-full md:w-64 flex-shrink-0 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col gap-5">
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
            TV Catalogue
          </p>
          <h2 className="text-lg font-bold text-white mt-1">Yunmakai TV</h2>
          <p className="text-xs text-zinc-500 mt-1">
            {products.length} Channel{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        <hr className="border-zinc-800" />

        {/* Search */}
        <div>
          <label
            htmlFor="tv-search"
            className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600"
          >
            Search
          </label>
          <input
            id="tv-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter channels..."
            className="mt-2 w-full bg-transparent border border-zinc-700 rounded px-3 py-2 text-xs font-mono text-white placeholder:text-zinc-600 focus:border-zinc-500 focus:outline-none transition-colors"
          />
        </div>

        <hr className="border-zinc-800" />

        {/* Decorative Channel Knob */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
            Channel
          </p>
          <div className="flex items-center gap-3 mt-2">
            <span className="w-8 h-8 border border-zinc-700 rounded-full text-zinc-600 text-xs font-mono flex items-center justify-center">
              −
            </span>
            <span className="text-lg font-bold text-zinc-400 font-mono w-8 text-center">
              {String(filtered.length).padStart(2, "0")}
            </span>
            <span className="w-8 h-8 border border-zinc-700 rounded-full text-zinc-600 text-xs font-mono flex items-center justify-center">
              +
            </span>
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Decorative Volume */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
            Volume
          </p>
          <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-3">
            <div className="w-2/3 h-full bg-zinc-600 rounded-full" />
          </div>
        </div>

        <hr className="border-zinc-800" />

        {/* Decorative Power */}
        <div className="w-full py-2.5 border border-zinc-700 text-zinc-500 text-xs font-mono uppercase tracking-wider rounded text-center">
          Power
        </div>
      </div>
    </div>
  );
}
