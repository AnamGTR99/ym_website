import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
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

          {/* TV Frame */}
          <PlaceholderSection
            label="TV Frame"
            asset="PNG — transparent TV frame overlay"
            dimensions="Fits viewport · Channels render inside frame boundary"
            behavior="Static frame · Channels grid sits inside"
            className="w-full"
          >
            {/* Channel Grid */}
            <div className="w-full grid grid-cols-3 gap-3 mt-6 max-w-2xl">
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
          </PlaceholderSection>

          {/* Channel tile assets */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <PlaceholderSection
              label="Channel Tile Frame"
              asset="PNG — individual tile border"
              behavior="Wraps each product thumbnail"
            />
            <PlaceholderSection
              label="Hover State"
              asset="CSS or image overlay"
              behavior="Visual feedback on tile hover"
            />
            <PlaceholderSection
              label="Selected State"
              asset="CSS or image overlay"
              behavior="Active channel highlight"
            />
          </div>

          {/* Search/Filter */}
          <PlaceholderSection
            label="Search & Filter Bar"
            behavior="Text search · Filter by product type or tag · Sits above or beside grid"
            className="w-full"
          />
        </div>
      </main>
    </>
  );
}
