"use client";

import { signOut } from "@/lib/auth/actions";

export default function AccountSettings({ email }: { email: string }) {
  return (
    <div className="border border-zinc-800 rounded-xl p-6 flex flex-col gap-4">
      <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-zinc-500">
        Settings
      </h2>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-mono text-zinc-600">Email</p>
          <p className="text-sm text-white mt-0.5">{email}</p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="px-4 py-2 border border-zinc-700 text-zinc-400 text-xs font-mono uppercase tracking-wider rounded hover:border-zinc-500 hover:text-white transition-colors"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
