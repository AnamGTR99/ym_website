"use client";

import Link from "next/link";

export default function ProductError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-xl font-bold uppercase tracking-widest text-white">
          Something went wrong
        </h1>
        <p className="text-sm text-zinc-500 mt-2 font-mono">
          Could not load this product. Please try again.
        </p>
        <div className="flex gap-3 justify-center mt-6">
          <button
            onClick={reset}
            className="px-4 py-2 text-xs font-mono uppercase border border-zinc-700 rounded text-zinc-400 hover:border-white hover:text-white transition-colors"
          >
            Retry
          </button>
          <Link
            href="/tv"
            className="px-4 py-2 text-xs font-mono uppercase border border-zinc-700 rounded text-zinc-400 hover:border-white hover:text-white transition-colors"
          >
            Back to TV
          </Link>
        </div>
      </div>
    </main>
  );
}
