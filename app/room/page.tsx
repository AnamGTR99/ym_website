import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

export default function RoomPage() {
  return (
    <>
      <WalkthroughNav current="/room" />
      <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-center">
            Motel Room Hub
          </h1>

          {/* Room background */}
          <PlaceholderSection
            label="Room Base Image"
            asset="WEBP — motel room environment"
            dimensions="Desktop: 1920×1080+ · Mobile: separate portrait composition"
            behavior="Full viewport background · Static or subtle ambient CSS animation"
            className="w-full min-h-[50vh] relative"
          >
            {/* Hotspot zones overlaid on room */}
            <div className="w-full grid grid-cols-2 gap-4 mt-6">
              <Link href="/tv" className="block">
                <div className="border-2 border-dashed border-amber-500/60 rounded-lg p-8 text-center hover:bg-amber-500/10 transition-colors cursor-pointer">
                  <p className="text-amber-400 font-bold uppercase text-sm tracking-wider">
                    Hotspot: TV
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">
                    Position: ~60% left, ~30% top
                  </p>
                  <p className="text-xs font-mono text-cyan-400/70 mt-1">
                    Click → Navigate to /tv
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">
                    Hover: Glow effect
                  </p>
                </div>
              </Link>

              <Link href="/credits" className="block">
                <div className="border-2 border-dashed border-purple-500/60 rounded-lg p-8 text-center hover:bg-purple-500/10 transition-colors cursor-pointer">
                  <p className="text-purple-400 font-bold uppercase text-sm tracking-wider">
                    Hotspot: Credits / Poster
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">
                    Position: ~20% left, ~40% top
                  </p>
                  <p className="text-xs font-mono text-cyan-400/70 mt-1">
                    Click → Open credits overlay
                  </p>
                  <p className="text-xs font-mono text-zinc-500 mt-1">
                    Hover: Highlight effect
                  </p>
                </div>
              </Link>
            </div>
          </PlaceholderSection>

          {/* Hotspot map info */}
          <PlaceholderSection
            label="Hotspot Map"
            asset="JSON — coordinates from Hugo"
            behavior="Percent-based positions (x%, y%, w%, h%) · Responsive · Separate mobile map"
            className="w-full"
          />

          {/* Room → TV transition */}
          <PlaceholderSection
            label="Room → TV Transition"
            asset="MP4 or Lottie — transition animation"
            dimensions="Full viewport"
            behavior="Plays when TV hotspot clicked · < 8MB"
            className="w-full"
          />
        </div>
      </main>
    </>
  );
}
