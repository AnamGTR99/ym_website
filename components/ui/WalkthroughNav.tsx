import Link from "next/link";

const routes = [
  { href: "/", label: "Landing" },
  { href: "/room", label: "Room" },
  { href: "/tv", label: "TV" },
  { href: "/tv/example-product", label: "Product" },
  { href: "/credits", label: "Credits" },
  { href: "/sign-in", label: "Sign In" },
];

export default function WalkthroughNav({ current }: { current: string }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-zinc-900/90 backdrop-blur border-b border-zinc-800">
      <div className="max-w-5xl mx-auto px-4 py-2 flex items-center justify-between">
        <span className="text-xs font-mono text-zinc-500 uppercase tracking-widest">
          Yunmakai Walkthrough
        </span>
        <div className="flex gap-1">
          {routes.map((route) => (
            <Link
              key={route.href}
              href={route.href}
              className={`px-3 py-1.5 text-xs font-mono rounded transition-colors ${
                current === route.href
                  ? "bg-white text-black"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              {route.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}
