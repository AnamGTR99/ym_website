import Link from "next/link";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

const channelNumbers = Array.from({ length: 9 }, (_, i) => i + 1);

export default function TVPage() {
  return (
    <>
      <WalkthroughNav current="/tv" />
      <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-center">
            TV Catalogue — Channel Grid
          </h1>

          {/* Retro TV Unit: Screen left, Controls right */}
          <div className="flex flex-col md:flex-row w-full border border-zinc-800 rounded-xl overflow-hidden">
            {/* TV Screen — Channel Grid */}
            <div className="flex-1 border border-dashed border-zinc-700 p-6 flex flex-col items-center justify-center gap-4">
              <p className="text-xs font-mono uppercase tracking-[0.2em] text-zinc-500">
                Placeholder
              </p>
              <h3 className="text-lg font-bold uppercase tracking-wider text-white">
                TV Screen — Channel Grid
              </h3>
              <p className="text-sm font-mono text-amber-400/80">
                Asset: PNG — transparent TV frame overlay
              </p>
              <p className="text-xs font-mono text-zinc-400">
                Channels render inside frame boundary
              </p>

              {/* Channel Grid */}
              <div className="w-full grid grid-cols-3 gap-3 mt-2 max-w-md">
                {channelNumbers.map((n) => (
                  <Link
                    key={n}
                    href={`/tv/example-product-${n}`}
                    className="block"
                  >
                    <div className="border border-dashed border-zinc-600 rounded aspect-square flex flex-col items-center justify-center gap-2 hover:border-white hover:bg-zinc-800/50 transition-colors cursor-pointer">
                      <span className="text-2xl font-bold text-zinc-500">
                        {String(n).padStart(2, "0")}
                      </span>
                      <p className="text-xs font-mono text-zinc-600">
                        Channel {n}
                      </p>
                      <p className="text-[10px] font-mono text-amber-400/60">
                        Product tile
                      </p>
                    </div>
                  </Link>
                ))}
              </div>
            </div>

            {/* TV Controls Panel — Right side (decorative) */}
            <div className="w-full md:w-64 flex-shrink-0 bg-zinc-950 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col gap-5">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  TV Catalogue
                </p>
                <h2 className="text-lg font-bold text-white mt-1">
                  Yunmakai TV
                </h2>
                <p className="text-xs text-zinc-500 mt-1">9 Channels</p>
              </div>

              <hr className="border-zinc-800" />

              {/* Decorative Channel Knob */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Channel
                </p>
                <div className="flex items-center gap-3 mt-2">
                  <button className="w-8 h-8 border border-zinc-700 rounded-full text-zinc-500 text-xs font-mono hover:border-zinc-500 transition-colors">
                    −
                  </button>
                  <span className="text-lg font-bold text-zinc-400 font-mono w-8 text-center">
                    01
                  </span>
                  <button className="w-8 h-8 border border-zinc-700 rounded-full text-zinc-500 text-xs font-mono hover:border-zinc-500 transition-colors">
                    +
                  </button>
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Decorative Volume Knob */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Volume
                </p>
                <div className="w-full h-1.5 bg-zinc-800 rounded-full mt-3">
                  <div className="w-2/3 h-full bg-zinc-600 rounded-full" />
                </div>
              </div>

              <hr className="border-zinc-800" />

              {/* Decorative Power Button */}
              <button className="w-full py-2.5 border border-zinc-700 text-zinc-500 text-xs font-mono uppercase tracking-wider rounded hover:border-zinc-500 transition-colors">
                Power
              </button>

              <hr className="border-zinc-800" />

              {/* Search/Filter */}
              <div>
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                  Search
                </p>
                <div className="mt-2 border border-zinc-700 rounded px-3 py-2">
                  <p className="text-xs font-mono text-zinc-600">
                    Filter channels...
                  </p>
                </div>
                <p className="text-[10px] font-mono text-cyan-400/70 mt-2">
                  Behavior: Text search · Filter by type or tag
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
