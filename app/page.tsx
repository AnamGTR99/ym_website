import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

export default function LandingPage() {
  return (
    <>
      <WalkthroughNav current="/" />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-12">
        {/* Hero — full viewport video zone */}
        <div className="w-full max-w-5xl flex flex-col items-center gap-8">
          <PlaceholderSection
            label="Bayou Water Animation — Ambient Loop"
            asset="MP4 (H.264) — landing-bg.mp4"
            dimensions="Full viewport · Desktop: 1920×1080 · Mobile: 720×1280"
            behavior="Seamless loop · Poster frame fallback while loading"
            className="w-full min-h-[60vh]"
          />

          {/* Overlay layers */}
          <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
            <PlaceholderSection
              label="Grain Overlay"
              asset="PNG — transparent texture"
              dimensions="Full viewport · Tiled or stretched"
              behavior="Fixed position · Semi-transparent · Over video"
            />
            <PlaceholderSection
              label="Fog Overlay"
              asset="PNG — layered fog elements"
              dimensions="Full viewport"
              behavior="Subtle parallax drift · Layered depth"
            />
          </div>

          {/* Entry prompt */}
          <PlaceholderSection
            label="Entry Interaction"
            behavior="Scroll or click triggers transition to /room"
            className="w-full"
          >
            <Link
              href="/room"
              className="mt-4 inline-block px-6 py-3 border border-zinc-600 rounded text-sm font-mono text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              Enter Room →
            </Link>
          </PlaceholderSection>

          {/* Transition */}
          <PlaceholderSection
            label="Landing → Room Transition"
            asset="MP4 or Lottie — transition animation"
            dimensions="Full viewport"
            behavior="Plays on trigger · < 8MB · Seamless scene change"
            className="w-full"
          />
        </div>
      </main>
    </>
  );
}
