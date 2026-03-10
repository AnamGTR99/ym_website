import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

export default function SignInPage() {
  return (
    <>
      <WalkthroughNav current="/sign-in" />
      <main className="relative min-h-screen flex items-center justify-center px-4">
        {/* Bayou background — same as landing page */}
        <div className="absolute inset-0 z-0">
          <PlaceholderSection
            label="Bayou Water Animation — Same as Landing"
            asset="MP4 (H.264) — landing-bg.mp4"
            dimensions="Full viewport · Shared with /"
            behavior="Seamless loop · Same video asset as landing page"
            className="w-full h-full min-h-0 rounded-none border-0"
          />
        </div>

        {/* Overlay — auth form centered on top of bayou */}
        <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
          <div className="backdrop-blur-xl bg-black/60 border border-zinc-700/50 rounded-2xl p-8 flex flex-col gap-5">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-center text-white">
              Sign In / Sign Up
            </h1>
            <p className="text-xs font-mono text-zinc-400 text-center">
              Optional — not required to browse or purchase
            </p>

            <hr className="border-zinc-700/50" />

            {/* Email */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                Email
              </p>
              <div className="mt-2 border border-zinc-600/50 bg-black/40 rounded px-4 py-3">
                <p className="text-sm font-mono text-zinc-500">
                  user@example.com
                </p>
              </div>
            </div>

            {/* Password */}
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500">
                Password
              </p>
              <div className="mt-2 border border-zinc-600/50 bg-black/40 rounded px-4 py-3">
                <p className="text-sm font-mono text-zinc-500">••••••••</p>
              </div>
            </div>

            <button className="w-full py-3 bg-white text-black text-sm font-mono uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors">
              Sign In
            </button>

            <hr className="border-zinc-700/50" />

            <button className="w-full py-3 border border-zinc-600/50 text-zinc-400 text-sm font-mono uppercase tracking-wider rounded hover:border-zinc-400 transition-colors">
              Create Account
            </button>

            <p className="text-[10px] font-mono text-cyan-400/70 text-center">
              Behavior: Supabase Auth · Email/password · Toggle sign-in / sign-up
            </p>

            <p className="text-[10px] font-mono text-amber-400/60 text-center">
              Asset: Bayou video plays behind this overlay
            </p>
          </div>

          <Link
            href="/room"
            className="text-xs font-mono text-zinc-400 hover:text-white transition-colors text-center"
          >
            ← Continue without account
          </Link>
        </div>
      </main>
    </>
  );
}
