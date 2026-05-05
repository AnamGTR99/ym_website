"use client";

import { useState, useTransition } from "react";
import { syncShopifyProducts } from "@/app/admin/actions";

export default function SyncProductsButton() {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  function handleSync() {
    setResult(null);
    startTransition(async () => {
      try {
        const res = await syncShopifyProducts();
        setResult({ success: true, message: `Synced ${res.synced} products` });
      } catch (err) {
        setResult({
          success: false,
          message: err instanceof Error ? err.message : "Sync failed",
        });
      }
    });
  }

  return (
    <div>
      <button
        onClick={handleSync}
        disabled={pending}
        className="w-full px-4 py-2.5 bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/40 rounded-md text-sm transition-colors disabled:opacity-50 text-zinc-300 hover:text-zinc-100"
      >
        {pending ? "Syncing..." : "↻ Sync Products"}
      </button>
      {result && (
        <p
          className={`text-xs font-mono mt-2 ${
            result.success ? "text-emerald-500" : "text-red-400"
          }`}
        >
          {result.success ? "✓" : "✗"} {result.message}
        </p>
      )}
    </div>
  );
}
