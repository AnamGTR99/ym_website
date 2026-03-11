"use client";

import { useCallback, useEffect, useState } from "react";

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
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const doFetch = useCallback(() => {
    fetch("/api/admin/products")
      .then((r) => {
        if (!r.ok) throw new Error(`Failed to load products (${r.status})`);
        return r.json();
      })
      .then((data) => {
        if (Array.isArray(data)) setProducts(data);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : "Failed to load products");
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    doFetch();
  }, [doFetch]);

  const retry = () => {
    setLoading(true);
    setError(null);
    doFetch();
  };

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

  if (error) {
    return (
      <div className="border border-red-400/20 rounded-lg px-4 py-3 bg-red-400/5">
        <p className="text-sm text-red-400">{error}</p>
        <button
          type="button"
          onClick={retry}
          className="mt-2 text-xs font-mono text-red-400 hover:text-white border border-red-400/30 hover:border-white px-3 py-1 rounded transition-colors"
        >
          Retry
        </button>
      </div>
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
