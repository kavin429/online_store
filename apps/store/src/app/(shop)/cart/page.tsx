"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useCart, type CartItem } from "@/context/addToCard";
import { formatLKR } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingCart,
  ArrowLeft,
  AlertTriangle,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

export default function CartPage() {
  const {
    cart,
    removeFromCart,
    updateQuantity,
    clearCart,
    refreshStock,
    stockById,
  } = useCart();

  const [checking, setChecking] = useState(true);
  const [pendingId, setPendingId] = useState<number | null>(null);

  // Every time the cart page opens, pull the real stock from the database.
  useEffect(() => {
    let active = true;

    refreshStock(cart).finally(() => {
      if (active) setChecking(false);
    });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const stockOf = (item: CartItem) => stockById[item.id] ?? item.stock;

  const hasStockIssue = cart.some((item) => {
    const stock = stockOf(item);
    return stock !== undefined && (stock <= 0 || item.quantity > stock);
  });

  const handleIncrease = async (item: CartItem) => {
    if (pendingId !== null) return;

    setPendingId(item.id);
    try {
      // Ask the database for the latest count before changing anything.
      const stocks = await refreshStock([item]);
      const stock = stocks[item.id] ?? item.stock;

      if (stock === undefined) {
        toast.error("Could not check stock. Please try again.");
        return;
      }

      if (stock <= 0) {
        toast.error(`${item.name} is out of stock`);
        return;
      }

      if (item.quantity + 1 > stock) {
        toast.error(`Only ${stock} left in stock`);
        return;
      }

      updateQuantity(item.id, item.quantity + 1);
    } finally {
      setPendingId(null);
    }
  };

  const handleDecrease = (item: CartItem) => {
    const result = updateQuantity(item.id, item.quantity - 1);

    if (!result.ok) {
      toast.error(result.message ?? "Could not update quantity");
      return;
    }

    // Keep the displayed stock fresh without blocking the click.
    void refreshStock([item]);
  };

  const subtotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 350 : 0;
  const total = subtotal + shipping;

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Your cart is empty
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Looks like you haven&apos;t added anything yet.
        </p>
        <Link href="/">
          <Button variant="shoe">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link
        href="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Continue Shopping
      </Link>

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          Your Cart ({cart.length})
        </h1>
        <button
          onClick={clearCart}
          className="text-sm text-red-500 hover:text-red-600 font-medium"
        >
          Clear Cart
        </button>
      </div>

      {hasStockIssue && (
        <div className="mb-6 flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>
            Some items are no longer available in the requested quantity. Reduce
            the quantity or remove the item to continue.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => {
            const stock = stockOf(item);
            const outOfStock = stock !== undefined && stock <= 0;
            const overStock =
              stock !== undefined && stock > 0 && item.quantity > stock;
            const lowStock =
              stock !== undefined && stock > 0 && stock <= 5 && !overStock;
            const busy = pendingId === item.id;

            return (
              <Card
                key={item.id}
                className={`p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 border ${
                  outOfStock || overStock
                    ? "border-red-200 dark:border-red-900/50"
                    : "border-fuchsia-100 dark:border-fuchsia-900/40"
                }`}
              >
                <img
                  src={item.images?.[0]?.url || "/placeholder.png"}
                  alt={item.name}
                  className="w-24 h-24 object-cover rounded-md border border-fuchsia-50 dark:border-zinc-800 shrink-0"
                />

                <div className="flex-1 w-full">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                        {item.name}
                      </h3>
                      {outOfStock && (
                        <span className="inline-block mt-1 rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-red-600 dark:bg-red-950/60 dark:text-red-400">
                          Out of stock
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-gray-400 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Remove item"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                    {formatLKR(item.sellingPrice)} each
                  </p>

                  {stock !== undefined && (
                    <p
                      className={`mt-1 text-xs font-medium ${
                        outOfStock || overStock
                          ? "text-red-500"
                          : lowStock
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-gray-400 dark:text-gray-500"
                      }`}
                    >
                      {outOfStock
                        ? "This item is out of stock until it is restocked."
                        : overStock
                          ? `Only ${stock} left in stock — reduce the quantity or remove it.`
                          : lowStock
                            ? `Only ${stock} left in stock`
                            : `${stock} in stock`}
                    </p>
                  )}

                  <div className="flex items-center justify-between mt-3">
                    {/* Quantity stepper */}
                    <div className="flex items-center border border-fuchsia-200 dark:border-fuchsia-900 rounded-md overflow-hidden">
                      <button
                        onClick={() => handleDecrease(item)}
                        disabled={busy}
                        className="p-2 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 transition-colors disabled:opacity-40"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-8 text-center text-sm font-semibold">
                        {busy ? (
                          <Loader2 className="h-3.5 w-3.5 mx-auto animate-spin" />
                        ) : (
                          item.quantity
                        )}
                      </span>
                      <button
                        onClick={() => handleIncrease(item)}
                        disabled={
                          busy ||
                          outOfStock ||
                          (stock !== undefined && item.quantity >= stock)
                        }
                        className="p-2 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                        aria-label="Increase quantity"
                        title={
                          stock !== undefined && item.quantity >= stock
                            ? "No more stock available"
                            : "Increase quantity"
                        }
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>

                    <p className="font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                      {formatLKR(item.sellingPrice * item.quantity)}
                    </p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Order summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 border border-fuchsia-100 dark:border-fuchsia-900/40 sticky top-24">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
              Order Summary
            </h2>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Subtotal</span>
                <span>{formatLKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>{formatLKR(shipping)}</span>
              </div>
              <div className="border-t border-fuchsia-100 dark:border-zinc-800 pt-2 mt-2 flex justify-between font-bold text-base text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>{formatLKR(total)}</span>
              </div>
            </div>

            {hasStockIssue ? (
              <Button variant="shoe" className="w-full mt-6" disabled>
                Remove out-of-stock items to continue
              </Button>
            ) : (
              <Link href="/checkout">
                <Button
                  variant="shoe"
                  className="w-full mt-6"
                  disabled={checking}
                >
                  {checking ? "Checking stock..." : "Proceed to Checkout"}
                </Button>
              </Link>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}
