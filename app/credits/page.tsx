import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

export default function CreditsPage() {
  return (
    <>
      <WalkthroughNav current="/credits" />
      <main className="min-h-screen flex flex-col items-center px-4 pt-16 pb-12">
        <div className="w-full max-w-5xl flex flex-col gap-6">
          <div className="flex items-center gap-3">
            <Link
              href="/room"
              className="text-xs font-mono text-zinc-500 hover:text-white transition-colors"
            >
              ← Back to Room
            </Link>
          </div>

          <h1 className="text-2xl font-bold uppercase tracking-widest text-center">
            Credits — Movie-Style Scroll
          </h1>

          {/* Background */}
          <PlaceholderSection
            label="Credits Background — Water Visual"
            asset="MP4 loop or static WEBP — lake/bayou"
            dimensions="Full viewport background"
            behavior="Same visual as landing or alternate water scene · Atmospheric overlays on top"
            className="w-full min-h-[30vh]"
          />

          {/* Credits text zones */}
          <div className="w-full flex flex-col gap-4">
            <PlaceholderSection
              label="Credits Text — Header"
              behavior="Large title · Fade-in animation · e.g. 'YUNMAKAI'"
            />
            <PlaceholderSection
              label="Credits Text — Music By"
              behavior="Line-by-line fade-in · Artist name(s)"
            />
            <PlaceholderSection
              label="Credits Text — Design By"
              behavior="Line-by-line fade-in · 'Hugo' or designer credit"
            />
            <PlaceholderSection
              label="Credits Text — Development"
              behavior="Line-by-line fade-in · Developer credits"
            />
            <PlaceholderSection
              label="Credits Text — Special Thanks"
              behavior="Line-by-line fade-in · Additional credits from Yunmakai"
            />
          </div>

          {/* Animation info */}
          <PlaceholderSection
            label="Animation Style"
            behavior="Classic scroll-up or fade-in line-by-line · Direction from Hugo · Dismiss on click or scroll-to-end"
            className="w-full"
          >
            <p className="text-xs font-mono text-zinc-500 mt-2">
              Note: In final implementation this will be an overlay triggered
              from Room, not a separate route
            </p>
          </PlaceholderSection>
        </div>
      </main>
    </>
  );
}
