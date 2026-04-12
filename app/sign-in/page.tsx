import Link from "next/link";
import SignInForm from "./SignInForm";

const MESSAGES: Record<string, string> = {
  "check-email": "Check your email to confirm your account.",
  "signed-out": "You have been signed out.",
  "error": "An error occurred. Please try again.",
  "email-verified": "Email verified! You can now sign in.",
};

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string; redirect?: string }>;
}) {
  const { message, redirect } = await searchParams;

  return (
    <main className="grain vignette relative min-h-screen flex items-center justify-center px-4 bg-void">
      <div className="absolute inset-0 z-0 bg-gradient-to-b from-void via-abyss to-void" />

      <div className="relative z-10 w-full max-w-md flex flex-col gap-6 animate-fade-up">
        <div className="backdrop-blur-xl bg-abyss/80 border border-charcoal/50 rounded-lg p-8 flex flex-col gap-5">
          <h1 className="text-2xl font-bold uppercase tracking-widest text-center text-bone">
            Sign In
          </h1>
          <p className="text-xs font-mono text-fog text-center">
            Optional — not required to browse or purchase
          </p>

          {message && MESSAGES[message] && (
            <p className="text-xs font-mono text-amber text-center bg-amber/10 rounded-lg px-4 py-2">
              {MESSAGES[message]}
            </p>
          )}

          <hr className="divider" />

          <SignInForm redirect={redirect} />
        </div>

        <Link
          href="/room"
          className="text-xs font-mono text-fog hover:text-amber transition-colors text-center"
        >
          ← Continue without account
        </Link>
      </div>
    </main>
  );
}
