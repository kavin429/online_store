"use client";

import { useState } from "react";
import { OrderCard } from "./OrderCard";
import type { OrderStatus, OrderView } from "./types";
import { cardCls, mutedCls } from "./ui";

export function OrdersTab({ orders }: { orders: OrderView[] }) {
  const [filter, setFilter] = useState<"All" | OrderStatus>("All");
  const [open, setOpen] = useState<number | null>(
    orders.find((o) => ["Shipped", "Out for delivery", "Processing"].includes(o.status))?.dbId ??
      orders[0]?.dbId ??
      null
  );

  const statuses: ("All" | OrderStatus)[] = [
    "All",
    "Pending",
    "Processing",
    "Shipped",
    "Out for delivery",
    "Delivered",
    "Cancelled",
    "Returned",
  ];
  const list = orders.filter((o) => filter === "All" || o.status === filter);

  return (
    <div className={cardCls}>
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-2 sm:mx-0 sm:px-0">
        {statuses.map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
              filter === s
                ? "border-fuchsia-600 bg-fuchsia-600 text-white"
                : "border-fuchsia-200 text-fuchsia-700 hover:bg-fuchsia-100 dark:border-fuchsia-900/50 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50"
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="mt-4 space-y-3">
        {orders.length === 0 && (
          <p className={mutedCls}>You have not placed an order yet.</p>
        )}
        {orders.length > 0 && list.length === 0 && (
          <p className={mutedCls}>No orders with this status.</p>
        )}
        {list.map((o) => (
          <OrderCard
            key={o.dbId}
            order={o}
            expanded={open === o.dbId}
            onToggle={() => setOpen(open === o.dbId ? null : o.dbId)}
          />
        ))}
      </div>
    </div>
  );
}
