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
  return current.startsWith(route.href) && current !== "/tv";
}

export default function WalkthroughNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Site navigation"
      className="fixed top-0 left-0 right-0 z-50 bg-abyss/90 backdrop-blur-md border-b border-charcoal"
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <span className="font-mono text-xs text-amber tracking-[0.15em] uppercase">
          Yunmakai
        </span>
        <div className="flex gap-0.5 items-center">
          {routes.map((route) => (
            <Link
              key={route.label}
              href={route.label === "Product" ? "/tv" : route.href}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-all duration-200 ${
                isActive(route, current)
                  ? "bg-amber/10 text-amber border border-amber/20"
                  : "text-fog hover:text-bone hover:bg-charcoal border border-transparent"
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
