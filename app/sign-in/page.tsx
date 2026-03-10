import Link from "next/link";
import WalkthroughNav from "@/components/ui/WalkthroughNav";
import SignInForm from "./SignInForm";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const { message, redirect } = await searchParams;

  return (
    <>
      <WalkthroughNav current="/sign-in" />
      <main className="relative min-h-screen flex items-center justify-center px-4">
        {/* Bayou background placeholder — same as landing page */}
        <div className="absolute inset-0 z-0 border border-dashed border-zinc-700 flex items-center justify-center">
          <p className="text-xs font-mono text-zinc-600 uppercase tracking-[0.2em]">
            Bayou Water Animation — Same as Landing
          </p>
        </div>

        {/* Auth form overlay */}
        <div className="relative z-10 w-full max-w-md flex flex-col gap-6">
          <div className="backdrop-blur-xl bg-black/60 border border-zinc-700/50 rounded-2xl p-8 flex flex-col gap-5">
            <h1 className="text-2xl font-bold uppercase tracking-widest text-center text-white">
              Sign In
            </h1>
            <p className="text-xs font-mono text-zinc-400 text-center">
              Optional — not required to browse or purchase
            </p>

            {message && (
              <p className="text-xs font-mono text-amber-400 text-center bg-amber-400/10 rounded-lg px-4 py-2">
                {message}
              </p>
            )}

            <hr className="border-zinc-700/50" />

            <SignInForm redirect={redirect} />
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
