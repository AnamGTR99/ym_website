"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import CartButton from "@/components/cart/CartButton";

export default function FloatingUI() {
  const pathname = usePathname();
  // Hide on the landing page — the user hasn't entered the experience
  // yet, and Account/Cart have nothing to act on.
  if (pathname === "/") return null;

  return (
    <div className="fixed top-4 right-4 z-30 flex items-center gap-1.5">
      <Link
        href="/account"
        className="px-2.5 py-1.5 text-[10px] font-mono text-fog hover:text-amber rounded transition-colors uppercase tracking-[0.15em]"
        aria-label="Account"
      >
        Account
      </Link>
      <CartButton />
    </div>
  );
}
