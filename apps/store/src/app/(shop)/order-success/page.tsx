"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatLKR } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { CheckCircle2, Package, Truck } from "lucide-react";

type OrderItem = {
  id: number;
  name: string;
  sellingPrice: number;
  quantity: number;
};

type Order = {
  id: number;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: string;
  subtotal: number;
  shipping: number;
  total: number;
  status: string;
  createdAt: string;
  items: OrderItem[];
};

export default function OrderSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) {
      setLoading(false);
      return;
    }

    async function loadOrder() {
      try {
        const res = await fetch(`/api/orders/${orderId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load order");
          return;
        }

        setOrder(data.order);
      } catch (err) {
        setError("Could not load order");
      } finally {
        setLoading(false);
      }
    }

    loadOrder();
  }, [orderId]);

  return (
    <div className="max-w-3xl mx-auto px-4 mt-20 pb-5 text-center">
      <CheckCircle2 className="h-16 w-16 mx-auto text-green-500 mb-4" />
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
        Order Placed Successfully!
      </h1>
      <p className="text-gray-500 dark:text-gray-400 mb-8">
        Thank you for your order. We&apos;ve sent a confirmation to your email.
      </p>

      {loading && (
        <p className="text-sm text-gray-400 mb-8">Loading order details...</p>
      )}

      {!loading && error && (
        <p className="text-sm text-red-500 mb-8">{error}</p>
      )}

      {!loading && order && (
        <Card className="p-6 text-left border border-fuchsia-100 dark:border-fuchsia-900/40 mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-fuchsia-500" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Order #{order.id}
              </h2>
            </div>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400">
              {order.status}
            </span>
          </div>

          <div className="space-y-3 mb-4">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-gray-700 dark:text-gray-300">
                  {item.name} x{item.quantity}
                </span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatLKR(item.sellingPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-t border-fuchsia-100 dark:border-zinc-800 pt-3 space-y-1 text-sm">
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatLKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-600 dark:text-gray-400">
              <span>Shipping</span>
              <span>{formatLKR(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-bold text-base text-gray-900 dark:text-gray-100 pt-1">
              <span>Total</span>
              <span>{formatLKR(order.total)}</span>
            </div>
          </div>

          <div className="border-t border-fuchsia-100 dark:border-zinc-800 mt-4 pt-4 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
            <Truck className="h-4 w-4 mt-0.5 shrink-0 text-fuchsia-500" />
            <div>
              <p className="font-medium text-gray-900 dark:text-gray-100">
                {order.fullName}
              </p>
              <p>{order.address}</p>
              <p>
                {order.city}, {order.postalCode}
              </p>
              <p>{order.phone}</p>
              <p className="mt-1 capitalize">
                Payment: {order.paymentMethod === "cod" ? "Cash on Delivery" : "Card"}
              </p>
            </div>
          </div>
        </Card>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link href="/">
          <Button variant="shoe">Continue Shopping</Button>
        </Link>
        <Link href="/orders">
          <Button variant="outline">View My Orders</Button>
        </Link>
      </div>
    </div>
  );
}