export default function ProductLoading() {
  return (
    <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
      <div className="w-full max-w-5xl flex flex-col gap-6">
        {/* Breadcrumb skeleton */}
        <div className="h-4 w-32 bg-zinc-800 rounded animate-pulse" />

        {/* Product layout skeleton */}
        <div className="flex flex-col md:flex-row w-full border border-zinc-800 rounded-xl overflow-hidden">
          {/* Screen */}
          <div className="flex-1 min-h-[400px] bg-zinc-900 animate-pulse" />
          {/* Controls */}
          <div className="w-full md:w-[380px] p-6 space-y-4 bg-zinc-950">
            <div className="h-6 w-3/4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-1/2 bg-zinc-800 rounded animate-pulse" />
            <div className="h-20 w-full bg-zinc-800 rounded animate-pulse mt-4" />
            <div className="h-10 w-full bg-zinc-800 rounded animate-pulse mt-4" />
          </div>
        </div>
      </div>
    </main>
  );
}
