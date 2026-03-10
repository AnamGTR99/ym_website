"use client";

import { useState } from "react";
import { signIn, signUp } from "@/lib/auth/actions";

export default function SignInForm({ redirect }: { redirect?: string }) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(null);
    setLoading(true);

    if (redirect) {
      formData.set("redirect", redirect);
    }

    const result =
      mode === "sign-in" ? await signIn(formData) : await signUp(formData);

    // If we get here, redirect didn't happen — there's an error
    if (result?.error) {
      setError(result.error);
    }
    setLoading(false);
  }

  return (
    <form action={handleSubmit} className="flex flex-col gap-5">
      <div>
        <label
          htmlFor="email"
          className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="mt-2 w-full border border-zinc-600/50 bg-black/40 rounded px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-[10px] font-mono uppercase tracking-[0.3em] text-zinc-500"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="mt-2 w-full border border-zinc-600/50 bg-black/40 rounded px-4 py-3 text-sm font-mono text-white placeholder:text-zinc-600 focus:outline-none focus:border-zinc-400 transition-colors"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-xs font-mono text-red-400 bg-red-400/10 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="w-full py-3 bg-white text-black text-sm font-mono uppercase tracking-wider rounded hover:bg-zinc-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading
          ? "..."
          : mode === "sign-in"
            ? "Sign In"
            : "Create Account"}
      </button>

      <hr className="border-zinc-700/50" />

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        className="w-full py-3 border border-zinc-600/50 text-zinc-400 text-sm font-mono uppercase tracking-wider rounded hover:border-zinc-400 transition-colors"
      >
        {mode === "sign-in"
          ? "Create Account Instead"
          : "Already Have an Account"}
      </button>
    </form>
  );
}
