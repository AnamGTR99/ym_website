"use client";

import ErrorState from "@/components/ui/ErrorState";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950">
      <ErrorState
        title="Something went wrong"
        message="An unexpected error occurred. Please try again."
        retry={reset}
      />
    </div>
  );
}
