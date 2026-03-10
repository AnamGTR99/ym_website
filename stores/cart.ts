import { create } from "zustand";
import { shopifyFetch } from "@/lib/shopify/client";
import {
  CART_CREATE_MUTATION,
  CART_LINES_ADD_MUTATION,
  CART_LINES_UPDATE_MUTATION,
  CART_LINES_REMOVE_MUTATION,
  CART_QUERY,
} from "@/lib/shopify/cart-queries";
import type {
  ShopifyCart,
  CartLine,
  CartCreateResult,
  CartLinesAddResult,
  CartLinesUpdateResult,
  CartLinesRemoveResult,
  CartQueryResult,
} from "@/lib/shopify/types";

const CART_ID_KEY = "ym_cart_id";

// Mutex to prevent concurrent cart mutations (e.g. double cart creation)
let pendingOp: Promise<void> = Promise.resolve();
function enqueue(fn: () => Promise<void>): Promise<void> {
  pendingOp = pendingOp.then(fn, fn);
  return pendingOp;
}

interface CartState {
  cart: ShopifyCart | null;
  lines: CartLine[];
  totalQuantity: number;
  isOpen: boolean;
  loading: boolean;
  error: string | null;
  initialized: boolean;

  initialize: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
  clearError: () => void;
}

function deriveCartState(cart: ShopifyCart | null) {
  if (!cart) return { cart: null, lines: [], totalQuantity: 0 };
  return {
    cart,
    lines: cart.lines.edges.map((e) => e.node),
    totalQuantity: cart.totalQuantity,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  lines: [],
  totalQuantity: 0,
  isOpen: false,
  loading: false,
  error: null,
  initialized: false,

  initialize: async () => {
    if (get().initialized) return;
    set({ initialized: true, loading: true });

    const cartId =
      typeof window !== "undefined" ? localStorage.getItem(CART_ID_KEY) : null;

    if (!cartId) {
      set({ loading: false });
      return;
    }

    try {
      const data = await shopifyFetch<CartQueryResult>(CART_QUERY, { cartId });

      if (data.cart) {
        set({ ...deriveCartState(data.cart), loading: false });
      } else {
        // Cart expired or invalid
        localStorage.removeItem(CART_ID_KEY);
        set({ loading: false });
      }
    } catch {
      localStorage.removeItem(CART_ID_KEY);
      set({ loading: false });
    }
  },

  addItem: (variantId, quantity = 1) =>
    enqueue(async () => {
      set({ loading: true, error: null });

      const { cart } = get();

      try {
        if (!cart) {
          const data = await shopifyFetch<CartCreateResult>(
            CART_CREATE_MUTATION,
            { input: { lines: [{ merchandiseId: variantId, quantity }] } }
          );

          if (data.cartCreate.userErrors.length > 0) {
            set({
              loading: false,
              error: data.cartCreate.userErrors[0].message,
            });
            return;
          }

          if (data.cartCreate.cart) {
            localStorage.setItem(CART_ID_KEY, data.cartCreate.cart.id);
            set({
              ...deriveCartState(data.cartCreate.cart),
              loading: false,
              isOpen: true,
            });
          }
        } else {
          const data = await shopifyFetch<CartLinesAddResult>(
            CART_LINES_ADD_MUTATION,
            { cartId: cart.id, lines: [{ merchandiseId: variantId, quantity }] }
          );

          if (data.cartLinesAdd.userErrors.length > 0) {
            set({
              loading: false,
              error: data.cartLinesAdd.userErrors[0].message,
            });
            return;
          }

          if (data.cartLinesAdd.cart) {
            set({
              ...deriveCartState(data.cartLinesAdd.cart),
              loading: false,
              isOpen: true,
            });
          }
        }
      } catch {
        set({ loading: false, error: "Failed to add item to cart" });
      }
    }),

  updateItem: (lineId, quantity) =>
    enqueue(async () => {
      // Route to removeItem if quantity drops to 0 or below
      if (quantity <= 0) {
        await get().removeItem(lineId);
        return;
      }

      const { cart } = get();
      if (!cart) return;

      set({ loading: true, error: null });

      try {
        const data = await shopifyFetch<CartLinesUpdateResult>(
          CART_LINES_UPDATE_MUTATION,
          { cartId: cart.id, lines: [{ id: lineId, quantity }] }
        );

        if (data.cartLinesUpdate.userErrors.length > 0) {
          set({
            loading: false,
            error: data.cartLinesUpdate.userErrors[0].message,
          });
          return;
        }

        if (data.cartLinesUpdate.cart) {
          set({ ...deriveCartState(data.cartLinesUpdate.cart), loading: false });
        }
      } catch {
        set({ loading: false, error: "Failed to update item" });
      }
    }),

  removeItem: (lineId) =>
    enqueue(async () => {
      const { cart } = get();
      if (!cart) return;

      set({ loading: true, error: null });

      try {
        const data = await shopifyFetch<CartLinesRemoveResult>(
          CART_LINES_REMOVE_MUTATION,
          { cartId: cart.id, lineIds: [lineId] }
        );

        if (data.cartLinesRemove.userErrors.length > 0) {
          set({
            loading: false,
            error: data.cartLinesRemove.userErrors[0].message,
          });
          return;
        }

        if (data.cartLinesRemove.cart) {
          set({
            ...deriveCartState(data.cartLinesRemove.cart),
            loading: false,
          });
        }
      } catch {
        set({ loading: false, error: "Failed to remove item" });
      }
    }),

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
  clearError: () => set({ error: null }),
}));
