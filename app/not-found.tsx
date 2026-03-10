import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-zinc-950 text-white px-4">
      <h1 className="text-6xl sm:text-8xl font-bold text-zinc-800 select-none">
        404
      </h1>
      <p className="text-sm font-mono text-zinc-500 mt-3 uppercase tracking-widest">
        Page not found
      </p>
      <div className="flex gap-3 mt-8">
        <Link
          href="/"
          className="px-5 py-2 border border-zinc-700 rounded text-sm text-zinc-300 hover:border-white hover:text-white transition-colors"
        >
          Home
        </Link>
        <Link
          href="/room"
          className="px-5 py-2 border border-zinc-700 rounded text-sm text-zinc-300 hover:border-white hover:text-white transition-colors"
        >
          Room
        </Link>
      </div>
    </div>
  );
}
