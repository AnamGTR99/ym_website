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
          className="text-label text-fog"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="input mt-2"
          placeholder="user@example.com"
        />
      </div>

      <div>
        <label
          htmlFor="password"
          className="text-label text-fog"
        >
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          required
          minLength={6}
          className="input mt-2"
          placeholder="••••••••"
        />
      </div>

      {error && (
        <p className="text-xs font-mono text-error bg-error/10 rounded-lg px-4 py-2">
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={loading}
        className="btn btn-primary w-full"
      >
        {loading
          ? "..."
          : mode === "sign-in"
            ? "Sign In"
            : "Create Account"}
      </button>

      <hr className="divider" />

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setError(null);
        }}
        className="btn btn-secondary w-full"
      >
        {mode === "sign-in"
          ? "Create Account Instead"
          : "Already Have an Account"}
      </button>
    </form>
  );
}
