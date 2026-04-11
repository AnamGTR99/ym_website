"use client";

import { signOut } from "@/lib/auth/actions";

export default function AccountSettings({ email }: { email: string }) {
  return (
    <div className="border border-charcoal rounded-lg p-6 flex flex-col gap-4 bg-abyss">
      <h2 className="text-label text-fog">
        Settings
      </h2>

      <div className="flex items-center justify-between">
        <div>
          <p className="text-label text-smoke">Email</p>
          <p className="text-sm text-bone mt-0.5">{email}</p>
        </div>

        <form action={signOut}>
          <button
            type="submit"
            className="btn btn-secondary"
          >
            Sign Out
          </button>
        </form>
      </div>
    </div>
  );
}
