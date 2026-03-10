export default function TVLoading() {
  return (
    <main className="min-h-screen px-4 pt-16 pb-12">
      <div className="w-full max-w-6xl mx-auto">
        {/* Title skeleton */}
        <div className="h-8 w-48 bg-zinc-800 rounded animate-pulse mb-6" />

        {/* Grid skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="aspect-square bg-zinc-900 rounded-lg animate-pulse"
            />
          ))}
        </div>
      </div>
    </main>
  );
}
