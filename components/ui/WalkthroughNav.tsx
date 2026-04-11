import Link from "next/link";
import CartButton from "@/components/cart/CartButton";

const routes = [
  { href: "/", label: "Landing" },
  { href: "/room", label: "Room" },
  { href: "/tv", label: "TV" },
  { href: "/credits", label: "Credits" },
  { href: "/sign-in", label: "Sign In" },
  { href: "/account", label: "Account" },
];

function isActive(routeHref: string, current: string) {
  if (routeHref === "/") return current === "/";
  if (routeHref === "/tv") return current === "/tv" || current.startsWith("/tv/");
  return current === routeHref;
}

export default function WalkthroughNav({ current }: { current: string }) {
  return (
    <nav
      aria-label="Site navigation"
      className="fixed top-0 left-0 right-0 z-50 bg-abyss/90 backdrop-blur-md border-b border-charcoal"
    >
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <Link
          href="/"
          className="font-mono text-xs text-amber tracking-[0.15em] uppercase hover:text-amber-bright transition-colors"
        >
          Yunmakai
        </Link>
        <div className="flex gap-0.5 items-center">
          {routes.map((route) => {
            const active = isActive(route.href, current);
            return (
              <Link
                key={route.href}
                href={route.href}
                aria-current={active ? "page" : undefined}
                className={`px-3 py-1.5 text-xs font-mono rounded transition-all duration-200 ${
                  active
                    ? "bg-amber/10 text-amber border border-amber/20"
                    : "text-fog hover:text-bone hover:bg-charcoal border border-transparent"
                }`}
              >
                {route.label}
              </Link>
            );
          })}
          <CartButton />
        </div>
      </div>
    </nav>
  );
}
