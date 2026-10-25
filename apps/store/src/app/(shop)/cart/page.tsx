"use client";

import React from "react";
import Link from "next/link";
import { useCart } from "@/context/addToCard";
import { formatLKR } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { Minus, Plus, Trash2, ShoppingCart, ArrowLeft } from "lucide-react";

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity, clearCart } = useCart();

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Cart items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card
              key={item.id}
              className="p-4 flex flex-col sm:flex-row items-center sm:items-start gap-4 border border-fuchsia-100 dark:border-fuchsia-900/40"
            >
              <img
                src={item.images?.[0]?.url || "/placeholder.png"}
                alt={item.name}
                className="w-24 h-24 object-cover rounded-md border border-fuchsia-50 dark:border-zinc-800 shrink-0"
              />

              <div className="flex-1 w-full">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {item.name}
                  </h3>
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

                <div className="flex items-center justify-between mt-3">
                  {/* Quantity stepper */}
                  <div className="flex items-center border border-fuchsia-200 dark:border-fuchsia-900 rounded-md overflow-hidden">
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="p-2 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 transition-colors"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-8 text-center text-sm font-semibold">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="p-2 hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 transition-colors"
                      aria-label="Increase quantity"
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
          ))}
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

            <Link href="/checkout">
              <Button variant="shoe" className="w-full mt-6">
                Proceed to Checkout
              </Button>
            </Link>
          </Card>
        </div>
      </div>
    </div>
  );
}