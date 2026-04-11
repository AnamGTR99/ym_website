"use client";

import Image from "next/image";
import { useCartStore } from "@/stores/cart";
import { formatPrice } from "@/lib/shopify/utils";
import type { CartLine } from "@/lib/shopify/types";

export default function CartItem({ line }: { line: CartLine }) {
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);
  const loading = useCartStore((s) => s.loading);

  const { merchandise } = line;

  return (
    <div className="flex gap-3 py-3 border-b border-charcoal last:border-0">
      {/* Image */}
      {merchandise.image ? (
        <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-soot">
          <Image
            src={merchandise.image.url}
            alt={merchandise.image.altText ?? merchandise.product.title}
            width={64}
            height={64}
            className="w-full h-full object-cover"
          />
        </div>
      ) : (
        <div className="w-16 h-16 flex-shrink-0 rounded bg-soot" />
      )}

      {/* Details */}
      <div className="flex-1 flex flex-col justify-between min-w-0">
        <div>
          <p className="text-sm text-bone truncate">
            {merchandise.product.title}
          </p>
          {merchandise.title !== "Default Title" && (
            <p className="text-xs text-fog">{merchandise.title}</p>
          )}
        </div>

        <div className="flex items-center justify-between">
          {/* Quantity controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (line.quantity === 1) {
                  removeItem(line.id);
                } else {
                  updateItem(line.id, line.quantity - 1);
                }
              }}
              disabled={loading}
              className="w-6 h-6 border border-ash rounded text-xs text-fog hover:border-fog hover:text-bone disabled:opacity-50 transition-colors"
            >
              −
            </button>
            <span className="text-xs font-mono text-bone w-4 text-center">
              {line.quantity}
            </span>
            <button
              onClick={() => updateItem(line.id, line.quantity + 1)}
              disabled={loading}
              className="w-6 h-6 border border-ash rounded text-xs text-fog hover:border-fog hover:text-bone disabled:opacity-50 transition-colors"
            >
              +
            </button>
          </div>

          {/* Price */}
          <span className="text-sm font-mono text-bone">
            {formatPrice(
              line.cost.totalAmount.amount,
              line.cost.totalAmount.currencyCode
            )}
          </span>
        </div>
      </div>
    </div>
  );
}
