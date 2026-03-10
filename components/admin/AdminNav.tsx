"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", exact: true },
  { href: "/admin/tracks", label: "Tracks", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-zinc-800 bg-zinc-950 p-4 flex flex-col gap-1">
      <div className="px-3 py-2 mb-4">
        <p className="text-xs font-mono uppercase tracking-widest text-zinc-500">
          Admin
        </p>
        <p className="text-sm font-bold text-white mt-1">Yunmakai</p>
      </div>

      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2 rounded text-sm transition-colors ${
              active
                ? "bg-zinc-800 text-white"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            }`}
          >
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-zinc-800">
        <Link
          href="/"
          className="px-3 py-2 rounded text-xs text-zinc-500 hover:text-white transition-colors block"
        >
          Back to Site
        </Link>
      </div>
    </nav>
  );
}
