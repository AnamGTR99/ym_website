import Link from "next/link";
import PlaceholderSection from "@/components/ui/PlaceholderSection";
import WalkthroughNav from "@/components/ui/WalkthroughNav";

export default function SignInPage() {
  return (
    <>
      <WalkthroughNav current="/sign-in" />
      <main className="min-h-screen flex flex-col items-center justify-center px-4 pt-16 pb-12">
        <div className="w-full max-w-md flex flex-col gap-6">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-center">
            Sign In / Sign Up
          </h1>
          <p className="text-xs font-mono text-zinc-500 text-center">
            Optional — not required to browse or purchase
          </p>

          {/* Auth Form */}
          <div className="border border-zinc-800 rounded-xl p-8 flex flex-col gap-5 bg-zinc-950">
            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                Email
              </p>
              <div className="mt-2 border border-zinc-700 rounded px-4 py-3">
                <p className="text-sm font-mono text-zinc-600">
                  user@example.com
                </p>
              </div>
            </div>

            <div>
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-600">
                Password
              </p>
              <div className="mt-2 border border-zinc-700 rounded px-4 py-3">
                <p className="text-sm font-mono text-zinc-600">••••••••</p>
              </div>
            </div>

            <button className="w-full py-3 bg-white text-black text-sm font-mono uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors">
              Sign In
            </button>

            <hr className="border-zinc-800" />

            <button className="w-full py-3 border border-zinc-700 text-zinc-400 text-sm font-mono uppercase tracking-wider rounded hover:border-zinc-500 transition-colors">
              Create Account
            </button>

            <p className="text-[10px] font-mono text-cyan-400/70 text-center">
              Behavior: Supabase Auth · Email/password · Toggle between sign-in
              and sign-up
            </p>
          </div>

          {/* Account Benefits */}
          <PlaceholderSection
            label="Account Benefits"
            behavior="Purchase history · Track entitlements · Order linking via email"
            className="w-full"
          />

          <Link
            href="/room"
            className="text-xs font-mono text-zinc-500 hover:text-white transition-colors text-center"
          >
            ← Continue without account
          </Link>
        </div>
      </main>
    </>
  );
}
