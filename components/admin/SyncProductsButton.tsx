"use client";

import { useState, useTransition } from "react";
import { syncShopifyProducts } from "@/app/admin/actions";

export default function SyncProductsButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<string | null>(null);

  function handleSync() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncShopifyProducts();
        setResult(`Synced ${res.synced} products from Shopify`);
      } catch (err) {
        setResult(
          err instanceof Error ? err.message : "Sync failed"
        );
      }
    });
  }

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSync}
        disabled={pending}
        className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded text-sm transition-colors disabled:opacity-50"
      >
        {pending ? "Syncing..." : "Sync Shopify Products"}
      </button>
      {result && (
        <p className="text-xs font-mono text-zinc-400">{result}</p>
      )}
    </div>
  );
}
