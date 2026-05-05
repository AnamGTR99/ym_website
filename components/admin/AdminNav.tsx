"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "◆", exact: true },
  { href: "/admin/tracks", label: "Tracks", icon: "♫", exact: false },
];

export default function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="w-56 shrink-0 border-r border-zinc-800/60 bg-zinc-950 p-4 flex flex-col gap-1">
      <div className="px-3 py-3 mb-6">
        <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-amber-600">
          Admin Panel
        </p>
        <p className="text-lg font-bold text-zinc-100 mt-1 tracking-wide">
          YUNMAKAI
        </p>
      </div>

      <p className="px-3 text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-600 mb-2">
        Navigation
      </p>

      {NAV_ITEMS.map((item) => {
        const active = item.exact
          ? pathname === item.href
          : pathname.startsWith(item.href);

        return (
          <Link
            key={item.href}
            href={item.href}
            className={`px-3 py-2.5 rounded-md text-sm transition-all flex items-center gap-2.5 ${
              active
                ? "bg-amber-600/10 text-amber-400 border border-amber-600/20"
                : "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/50 border border-transparent"
            }`}
          >
            <span className="text-xs">{item.icon}</span>
            {item.label}
          </Link>
        );
      })}

      <div className="mt-auto pt-4 border-t border-zinc-800/40">
        <Link
          href="/"
          className="px-3 py-2 rounded-md text-xs text-zinc-600 hover:text-zinc-300 transition-colors block"
        >
          ← Back to Site
        </Link>
      </div>
    </nav>
  );
}
