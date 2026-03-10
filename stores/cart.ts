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

interface CartState {
  cart: ShopifyCart | null;
  lines: CartLine[];
  totalQuantity: number;
  isOpen: boolean;
  loading: boolean;

  initialize: () => Promise<void>;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  openCart: () => void;
  closeCart: () => void;
}

function setCartState(cart: ShopifyCart | null) {
  if (!cart) return { cart: null, lines: [], totalQuantity: 0, loading: false };
  return {
    cart,
    lines: cart.lines.edges.map((e) => e.node),
    totalQuantity: cart.totalQuantity,
    loading: false,
  };
}

export const useCartStore = create<CartState>((set, get) => ({
  cart: null,
  lines: [],
  totalQuantity: 0,
  isOpen: false,
  loading: false,

  initialize: async () => {
    const cartId =
      typeof window !== "undefined" ? localStorage.getItem(CART_ID_KEY) : null;

    if (!cartId) return;

    try {
      const data = await shopifyFetch<CartQueryResult>(CART_QUERY, { cartId });

      if (data.cart) {
        set(setCartState(data.cart));
      } else {
        // Cart expired or invalid — clear stored ID
        localStorage.removeItem(CART_ID_KEY);
      }
    } catch {
      localStorage.removeItem(CART_ID_KEY);
    }
  },

  addItem: async (variantId, quantity = 1) => {
    set({ loading: true });

    const { cart } = get();

    try {
      if (!cart) {
        // Create new cart with the item
        const data = await shopifyFetch<CartCreateResult>(
          CART_CREATE_MUTATION,
          {
            input: {
              lines: [{ merchandiseId: variantId, quantity }],
            },
          }
        );

        if (data.cartCreate.cart) {
          localStorage.setItem(CART_ID_KEY, data.cartCreate.cart.id);
          set({ ...setCartState(data.cartCreate.cart), isOpen: true });
        } else {
          set({ loading: false });
        }
      } else {
        // Add to existing cart
        const data = await shopifyFetch<CartLinesAddResult>(
          CART_LINES_ADD_MUTATION,
          {
            cartId: cart.id,
            lines: [{ merchandiseId: variantId, quantity }],
          }
        );

        if (data.cartLinesAdd.cart) {
          set({ ...setCartState(data.cartLinesAdd.cart), isOpen: true });
        } else {
          set({ loading: false });
        }
      }
    } catch {
      set({ loading: false });
    }
  },

  updateItem: async (lineId, quantity) => {
    const { cart } = get();
    if (!cart) return;

    set({ loading: true });

    try {
      const data = await shopifyFetch<CartLinesUpdateResult>(
        CART_LINES_UPDATE_MUTATION,
        {
          cartId: cart.id,
          lines: [{ id: lineId, quantity }],
        }
      );

      if (data.cartLinesUpdate.cart) {
        set(setCartState(data.cartLinesUpdate.cart));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  removeItem: async (lineId) => {
    const { cart } = get();
    if (!cart) return;

    set({ loading: true });

    try {
      const data = await shopifyFetch<CartLinesRemoveResult>(
        CART_LINES_REMOVE_MUTATION,
        {
          cartId: cart.id,
          lineIds: [lineId],
        }
      );

      if (data.cartLinesRemove.cart) {
        set(setCartState(data.cartLinesRemove.cart));
      } else {
        set({ loading: false });
      }
    } catch {
      set({ loading: false });
    }
  },

  openCart: () => set({ isOpen: true }),
  closeCart: () => set({ isOpen: false }),
}));
