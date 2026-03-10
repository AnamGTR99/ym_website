"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart";
import CartItem from "./CartItem";

export default function CartPanel() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const lines = useCartStore((s) => s.lines);
  const cart = useCartStore((s) => s.cart);
  const totalQuantity = useCartStore((s) => s.totalQuantity);
  const initialize = useCartStore((s) => s.initialize);

  useEffect(() => {
    initialize();
  }, [initialize]);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeCart();
    }
    if (isOpen) {
      document.addEventListener("keydown", handleKey);
      return () => document.removeEventListener("keydown", handleKey);
    }
  }, [isOpen, closeCart]);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
          onClick={closeCart}
        />
      )}

      {/* Panel */}
      <div
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-zinc-950 border-l border-zinc-800 transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
            <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-white">
              Cart{totalQuantity > 0 && ` (${totalQuantity})`}
            </h2>
            <button
              onClick={closeCart}
              className="text-zinc-500 hover:text-white text-lg transition-colors"
            >
              ✕
            </button>
          </div>

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {lines.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-zinc-600 text-sm">Your cart is empty</p>
              </div>
            ) : (
              lines.map((line) => <CartItem key={line.id} line={line} />)
            )}
          </div>

          {/* Footer */}
          {lines.length > 0 && cart && (
            <div className="px-5 py-4 border-t border-zinc-800 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-zinc-500">
                  Subtotal
                </span>
                <span className="text-sm font-mono text-white">
                  {cart.cost.subtotalAmount.currencyCode}{" "}
                  {cart.cost.subtotalAmount.amount}
                </span>
              </div>

              <a
                href={cart.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full py-3 bg-white text-black text-sm font-mono uppercase tracking-wider rounded text-center hover:bg-zinc-200 transition-colors"
              >
                Checkout
              </a>

              <p className="text-[10px] text-zinc-600 text-center">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
