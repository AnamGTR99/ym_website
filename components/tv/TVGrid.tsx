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
    <div className="flex flex-col md:flex-row w-full border border-charcoal rounded overflow-hidden animate-fade-up delay-200">
      {/* TV Screen — Channel Grid */}
      <div className="scanlines flex-1 bg-soot p-5 md:p-6 flex flex-col gap-4 relative">
        {/* Screen header */}
        <div className="flex items-center justify-between relative z-10">
          <p className="text-label text-fog">
            {filtered.length} Channel{filtered.length !== 1 ? "s" : ""}
          </p>
          {search && (
            <button
              onClick={() => setSearch("")}
              className="text-label text-fog hover:text-amber transition-colors"
            >
              Clear filter
            </button>
          )}
        </div>

        {/* Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-3 gap-2 sm:gap-3 relative z-10">
            {filtered.map((product, i) => (
              <TVCard key={product.id} product={product} channelNumber={i + 1} />
            ))}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center min-h-[300px] relative z-10">
            <div className="text-center">
              <p className="text-fog text-sm font-mono">No channels found</p>
              {search && (
                <p className="text-smoke text-xs font-mono mt-1">
                  Try a different search term
                </p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* TV Controls Panel */}
      <div className="w-full md:w-64 flex-shrink-0 bg-abyss border-t md:border-t-0 md:border-l border-charcoal p-6 flex flex-col gap-5">
        <div>
          <p className="text-label text-fog">TV Catalogue</p>
          <h2 className="text-display-sm text-bone mt-1">Yunmakai TV</h2>
          <p className="text-xs text-fog mt-1 font-mono">
            {products.length} Channel{products.length !== 1 ? "s" : ""}
          </p>
        </div>

        <hr className="divider" />

        {/* Search */}
        <div>
          <label
            htmlFor="tv-search"
            className="text-label text-fog"
          >
            Search
          </label>
          <input
            id="tv-search"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Filter channels..."
            className="input mt-2"
          />
        </div>

        <hr className="divider" />

        {/* Decorative Channel Knob */}
        <div>
          <p className="text-label text-fog">Channel</p>
          <div className="flex items-center gap-3 mt-2">
            <span className="w-8 h-8 border border-ash rounded-full text-fog text-xs font-mono flex items-center justify-center hover:border-amber hover:text-amber transition-colors cursor-pointer">
              −
            </span>
            <span className="text-lg font-bold text-amber font-mono w-8 text-center">
              {String(filtered.length).padStart(2, "0")}
            </span>
            <span className="w-8 h-8 border border-ash rounded-full text-fog text-xs font-mono flex items-center justify-center hover:border-amber hover:text-amber transition-colors cursor-pointer">
              +
            </span>
          </div>
        </div>

        <hr className="divider" />

        {/* Decorative Volume */}
        <div>
          <p className="text-label text-fog">Volume</p>
          <div className="w-full h-1.5 bg-charcoal rounded-full mt-3">
            <div className="w-2/3 h-full bg-amber/40 rounded-full" />
          </div>
        </div>

        <hr className="divider" />

        {/* Decorative Power */}
        <button className="btn btn-secondary w-full">
          Power
        </button>
      </div>
    </div>
  );
}
