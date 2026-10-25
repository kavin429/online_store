"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatLKR } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { Package, ChevronRight, ShoppingBag } from "lucide-react";

type OrderItem = {
  id: number;
  name: string;
  sellingPrice: number;
  quantity: number;
};

type Order = {
  id: number;
  total: number;
  status: string;
  paymentMethod: string;
  createdAt: string;
  items: OrderItem[];
};

const statusStyles: Record<string, string> = {
  PENDING: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  CONFIRMED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  SHIPPED: "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400",
  DELIVERED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  CANCELLED: "bg-red-50 text-red-600 dark:bg-red-950 dark:text-red-400",
};

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetch("/api/orders");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load orders");
          return;
        }

        setOrders(data.orders);
      } catch (err) {
        setError("Could not load orders");
      } finally {
        setLoading(false);
      }
    }

    loadOrders();
  }, []);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-gray-400">Loading your orders...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <p className="text-red-500">{error}</p>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <ShoppingBag className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No orders yet
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Your placed orders will show up here.
        </p>
        <Link href="/">
          <Button variant="shoe">Start Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 mt-20 pb-5">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        My Orders
      </h1>

      <div className="space-y-4">
        {orders.map((order) => (
          <Link key={order.id} href={`/order-success?orderId=${order.id}`}>
            <Card className="p-5 border border-fuchsia-100 dark:border-fuchsia-900/40 hover:border-fuchsia-300 dark:hover:border-fuchsia-700 transition-colors cursor-pointer">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="h-10 w-10 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center shrink-0">
                    <Package className="h-5 w-5 text-fuchsia-500" />
                  </div>

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">
                      Order #{order.id}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400 truncate">
                      {order.items.length} item{order.items.length !== 1 ? "s" : ""} ·{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-LK", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 shrink-0">
                  <span
                    className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                      statusStyles[order.status] || "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {order.status}
                  </span>

                  <p className="font-semibold text-gray-900 dark:text-gray-100 whitespace-nowrap">
                    {formatLKR(order.total)}
                  </p>

                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}