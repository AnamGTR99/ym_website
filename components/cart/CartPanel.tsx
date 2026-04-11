"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart";
import { useFocusTrap } from "@/hooks/useFocusTrap";
import CartItem from "./CartItem";
import { formatPrice } from "@/lib/shopify/utils";

export default function CartPanel() {
  const isOpen = useCartStore((s) => s.isOpen);
  const closeCart = useCartStore((s) => s.closeCart);
  const lines = useCartStore((s) => s.lines);
  const cart = useCartStore((s) => s.cart);
  const totalQuantity = useCartStore((s) => s.totalQuantity);
  const error = useCartStore((s) => s.error);
  const clearError = useCartStore((s) => s.clearError);
  const initialize = useCartStore((s) => s.initialize);
  const panelRef = useFocusTrap<HTMLDivElement>(isOpen);

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
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Shopping cart"
        className={`fixed top-0 right-0 z-50 h-full w-full max-w-md bg-abyss border-l border-charcoal transform transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-charcoal">
            <h2 className="text-sm font-mono uppercase tracking-[0.2em] text-bone">
              Cart{totalQuantity > 0 && ` (${totalQuantity})`}
            </h2>
            <button
              onClick={closeCart}
              className="text-fog hover:text-bone text-lg transition-colors"
              aria-label="Close cart"
            >
              ✕
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="px-5 py-3 bg-error/10 border-b border-error/20">
              <div className="flex items-center justify-between">
                <p className="text-xs font-mono text-error">{error}</p>
                <button
                  onClick={clearError}
                  className="text-error/60 hover:text-error text-xs"
                >
                  ✕
                </button>
              </div>
            </div>
          )}

          {/* Items */}
          <div className="flex-1 overflow-y-auto px-5 py-3">
            {lines.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-smoke text-sm">Your cart is empty</p>
              </div>
            ) : (
              lines.map((line) => <CartItem key={line.id} line={line} />)
            )}
          </div>

          {/* Footer */}
          {lines.length > 0 && cart && (
            <div className="px-5 py-4 border-t border-charcoal flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono uppercase text-fog">
                  Subtotal
                </span>
                <span className="text-sm font-mono text-bone">
                  {formatPrice(
                    cart.cost.subtotalAmount.amount,
                    cart.cost.subtotalAmount.currencyCode
                  )}
                </span>
              </div>

              <a
                href={cart.checkoutUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary block w-full py-3 text-sm rounded text-center"
              >
                Checkout
              </a>

              <p className="text-[10px] text-smoke text-center">
                Taxes and shipping calculated at checkout
              </p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
