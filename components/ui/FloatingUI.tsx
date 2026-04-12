"use client";

import Link from "next/link";
import CartButton from "@/components/cart/CartButton";

export default function FloatingUI() {
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
