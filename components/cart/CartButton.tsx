"use client";

import { useCartStore } from "@/stores/cart";

export default function CartButton() {
  const openCart = useCartStore((s) => s.openCart);
  const totalQuantity = useCartStore((s) => s.totalQuantity);

  return (
    <button
      onClick={openCart}
      className="relative px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
    >
      Cart
      {totalQuantity > 0 && (
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-white text-black text-[10px] font-mono rounded-full flex items-center justify-center">
          {totalQuantity}
        </span>
      )}
    </button>
  );
}
