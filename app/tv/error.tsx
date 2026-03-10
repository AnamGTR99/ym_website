"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function TVError({ reset }: { reset: () => void }) {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <ErrorState
        title="Could not load TV"
        message="Shopify may be temporarily unavailable. Please try again."
        retry={reset}
      />
    </main>
  );
}
