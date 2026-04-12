"use client";

import { useState } from "react";
import type { ShopifyProductItem } from "./TrackForm";

interface ProductSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  products?: ShopifyProductItem[];
}

export default function ProductSelector({
  selectedIds,
  onChange,
  products = [],
}: ProductSelectorProps) {
  const [search, setSearch] = useState("");

  const filtered = products.filter((p) =>
    p.title.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    if (selectedIds.includes(id)) {
      onChange(selectedIds.filter((sid) => sid !== id));
    } else {
      onChange([...selectedIds, id]);
    }
  };

  return (
    <div>
      <input
        type="text"
        placeholder="Search products..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full bg-zinc-900 border border-zinc-700 rounded px-3 py-2 text-sm mb-2"
      />

      <div className="max-h-48 overflow-y-auto border border-zinc-800 rounded">
        {products.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-600 text-center">
            No Shopify products found
          </p>
        ) : filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-600 text-center">
            No matches for &ldquo;{search}&rdquo;
          </p>
        ) : (
          filtered.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => toggle(p.id)}
              className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                selectedIds.includes(p.id)
                  ? "bg-zinc-800 text-white"
                  : "text-zinc-400 hover:bg-zinc-900"
              }`}
            >
              <span
                className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${
                  selectedIds.includes(p.id)
                    ? "bg-white border-white text-black"
                    : "border-zinc-600"
                }`}
              >
                {selectedIds.includes(p.id) ? "✓" : ""}
              </span>
              <span className="truncate">{p.title}</span>
            </button>
          ))
        )}
      </div>

      {selectedIds.length > 0 && (
        <p className="text-xs text-zinc-500 mt-1">
          {selectedIds.length} product{selectedIds.length !== 1 ? "s" : ""}{" "}
          selected
        </p>
      )}
    </div>
  );
}
