"use client";

import React, { createContext, useCallback, useContext, useState } from "react";

export type CartItem = {
  id: number;
  name: string;
  sellingPrice: number;
  costPrice?: number;
  images?: { id: number; url: string }[];
  quantity: number;
  /** Live stock snapshot for this cart line, refreshed from the database. */
  stock?: number;
  /** Variant the shopper picked, used to read variant-level stock. */
  variantId?: number | null;
  selectedVariants?: Record<string, number>;
  [key: string]: any;
};

export type CartActionResult = {
  ok: boolean;
  /** Set when the action was blocked or the quantity had to be capped. */
  message?: string;
};

type CartContextType = {
  cart: CartItem[];
  /** Latest stock values keyed by product id. */
  stockById: Record<number, number>;
  addToCart: (product: any) => CartActionResult;
  removeFromCart: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => CartActionResult;
  clearCart: () => void;
  isInCart: (id: number) => boolean;
  /** Re-reads stock for the given cart lines from the database. */
  refreshStock: (items: CartItem[]) => Promise<Record<number, number>>;
  getStock: (id: number) => number | undefined;
  isOutOfStock: (id: number) => boolean;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [stockById, setStockById] = useState<Record<number, number>>({});

  const getStock = (id: number) => stockById[id];

  const isOutOfStock = (id: number) => {
    const stock = stockById[id];
    return stock !== undefined && stock <= 0;
  };

  const refreshStock = useCallback(async (items: CartItem[]) => {
    const lines = items.filter(
      (item) => Number.isInteger(item.id) && item.id > 0,
    );

    if (lines.length === 0) {
      setStockById({});
      return {};
    }

    try {
      const res = await fetch("/api/cart/stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((item) => ({
            id: item.id,
            variantId: item.variantId ?? null,
            selectedVariants: item.selectedVariants ?? null,
          })),
        }),
      });

      if (!res.ok) return {};

      const data = await res.json();
      const next: Record<number, number> = {};

      for (const line of data?.items ?? []) {
        if (line && Number.isInteger(line.productId)) {
          next[line.productId] = Math.max(0, Number(line.stock) || 0);
        }
      }

      setStockById(next);
      setCart((prev) =>
        prev.map((item) =>
          item.id in next ? { ...item, stock: next[item.id] } : item,
        ),
      );

      return next;
    } catch (error) {
      console.error("REFRESH CART STOCK ERROR:", error);
      return {};
    }
  }, []);

  const addToCart = (product: any): CartActionResult => {
    if (!product || !Number.isInteger(product.id)) {
      return { ok: false, message: "Invalid product" };
    }

    const liveStock =
      stockById[product.id] ??
      (typeof product.stock === "number" ? product.stock : undefined);

    if (liveStock !== undefined && liveStock <= 0) {
      return {
        ok: false,
        message: `${product.name ?? "This product"} is out of stock`,
      };
    }

    const existing = cart.find((item) => item.id === product.id);

    if (existing) {
      const limit = liveStock ?? existing.stock;

      if (limit !== undefined && existing.quantity + 1 > limit) {
        return {
          ok: false,
          message:
            limit <= 0
              ? `${product.name ?? "This product"} is out of stock`
              : `Only ${limit} left in stock`,
        };
      }

      setCart((prev) =>
        prev.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1, stock: limit }
            : item,
        ),
      );

      return { ok: true };
    }

    const requested = Math.max(1, Number(product.quantity) || 1);
    const quantity =
      liveStock !== undefined ? Math.min(requested, liveStock) : requested;

    setCart((prev) => [...prev, { ...product, quantity }]);

    if (liveStock !== undefined && quantity < requested) {
      return { ok: true, message: `Only ${liveStock} left in stock` };
    }

    return { ok: true };
  };

  const removeFromCart = (id: number) => {
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: number, quantity: number): CartActionResult => {
    if (quantity < 1) {
      removeFromCart(id);
      return { ok: true };
    }

    const existing = cart.find((item) => item.id === id);
    const limit = stockById[id] ?? existing?.stock;

    if (limit !== undefined && quantity > limit) {
      return {
        ok: false,
        message:
          limit <= 0
            ? "This product is out of stock"
            : `Only ${limit} left in stock`,
      };
    }

    setCart((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity } : item)),
    );

    return { ok: true };
  };

  const clearCart = () => {
    setCart([]);
    setStockById({});
  };

  const isInCart = (id: number) => cart.some((item) => item.id === id);

  return (
    <CartContext.Provider
      value={{
        cart,
        stockById,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        isInCart,
        refreshStock,
        getStock,
        isOutOfStock,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within a CartProvider");
  return context;
}
