import Link from "next/link";
import CartButton from "@/components/cart/CartButton";

const routes = [
  { href: "/", label: "Landing", exact: true },
  { href: "/room", label: "Room", exact: true },
  { href: "/tv", label: "TV", exact: true },
  { href: "/tv/", label: "Product", exact: false },
  { href: "/credits", label: "Credits", exact: true },
  { href: "/sign-in", label: "Sign In", exact: true },
  { href: "/account", label: "Account", exact: true },
];

function isActive(route: (typeof routes)[number], current: string) {
  if (route.exact) return current === route.href;
  // For product pages: match any /tv/[handle] but not /tv itself
  return current.startsWith(route.href) && current !== "/tv";
}

export default function WalkthroughNav({ current }: { current: string }) {
  return (
    <nav aria-label="Site navigation" className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Yunmakai Walkthrough
        </span>
        <div className="flex gap-1 items-center">
          {routes.map((route) => (
            <Link
              key={route.label}
              href={route.label === "Product" ? "/tv" : route.href}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                isActive(route, current)
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {route.label}
            </Link>
          ))}
          <CartButton />
        </div>
      </div>
    </nav>
  );
}
