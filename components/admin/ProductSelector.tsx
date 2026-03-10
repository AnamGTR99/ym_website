"use client";

import { useEffect, useState } from "react";

interface ShopifyProduct {
  id: string;
  title: string;
  handle: string;
  image: string | null;
}

interface ProductSelectorProps {
  selectedIds: string[];
  onChange: (ids: string[]) => void;
}

export default function ProductSelector({
  selectedIds,
  onChange,
}: ProductSelectorProps) {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/products")
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .finally(() => setLoading(false));
  }, []);

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

  if (loading) {
    return (
      <p className="text-sm text-zinc-500">Loading Shopify products...</p>
    );
  }

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
        {filtered.length === 0 ? (
          <p className="px-3 py-4 text-sm text-zinc-600 text-center">
            No products found
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
