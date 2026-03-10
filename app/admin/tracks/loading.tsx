export default function TracksLoading() {
  return (
    <div className="max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="h-8 w-32 bg-zinc-800 rounded animate-pulse" />
        <div className="h-9 w-24 bg-zinc-800 rounded animate-pulse" />
      </div>

      {/* Table skeleton */}
      <div className="border border-zinc-800 rounded-lg overflow-hidden">
        <div className="h-10 bg-zinc-900/50 border-b border-zinc-800" />
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="h-14 border-b border-zinc-800/50 flex items-center px-4 gap-4"
          >
            <div className="h-4 w-1/4 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-1/6 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
            <div className="h-4 w-16 bg-zinc-800 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
