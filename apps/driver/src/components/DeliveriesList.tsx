"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@online-store/ui/status-badge";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { toast } from "sonner";
import {
  MapPin,
  Navigation,
  Package,
  Phone,
  ChevronRight,
  ShoppingBag,
} from "lucide-react";
import {
  DELIVERY_LABELS,
  nextDriverActions,
  type DeliveryStatus,
} from "@/lib/delivery";
import { DriverOrder } from "@/lib/types";
import { formatLKR } from "@/lib/utils";

const ACTION_LABELS: Partial<Record<DeliveryStatus, string>> = {
  PICKED_UP: "Mark picked up",
  OUT_FOR_DELIVERY: "Start delivery",
  DELIVERED: "Mark delivered",
  FAILED: "Report problem",
};

export default function DeliveriesList({ orders }: { orders: DriverOrder[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);
  const [noteFor, setNoteFor] = useState<number | null>(null);
  const [note, setNote] = useState("");

  const updateStatus = async (order: DriverOrder, status: DeliveryStatus) => {
    setBusyId(order.id);
    try {
      const res = await fetch(`/api/deliveries/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deliveryStatus: status,
          note: noteFor === order.id ? note : undefined,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not update delivery");

      toast.success(DELIVERY_LABELS[status]);
      setNoteFor(null);
      setNote("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not update delivery");
    } finally {
      setBusyId(null);
    }
  };

  if (orders.length === 0) {
    return (
      <Card className="p-10 text-center">
        <ShoppingBag className="mx-auto mb-3 h-12 w-12 text-fuchsia-200" />
        <h2 className="text-lg font-semibold">No deliveries right now</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          New orders assigned by the admin will appear here automatically.
        </p>
        <Button variant="outline" className="mt-4" onClick={() => router.refresh()}>
          Refresh
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const actions = nextDriverActions(order.deliveryStatus);
        const addressQuery = encodeURIComponent(
          `${order.address}, ${order.city} ${order.postalCode}`,
        );
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <Card key={order.id} className="overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-fuchsia-100 bg-fuchsia-50/50 p-4 dark:border-neutral-800 dark:bg-neutral-900">
              <div>
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-fuchsia-600" />
                  <p className="font-semibold">Order #{order.id}</p>
                  <StatusBadge
                    status={order.deliveryStatus}
                    label={DELIVERY_LABELS[order.deliveryStatus]}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {itemCount} item{itemCount === 1 ? "" : "s"} ·{" "}
                  {order.paymentMethod === "cod" ? "Cash on delivery" : "Paid by card"} ·{" "}
                  {formatLKR(order.total)}
                </p>
              </div>

              <Link
                href={`/dashboard/deliveries/${order.id}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-fuchsia-700 hover:bg-fuchsia-100 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/40"
              >
                Details <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 p-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="font-medium">{order.fullName}</p>
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
                  <span>
                    {order.address}, {order.city} {order.postalCode}
                  </span>
                </p>
                <div className="flex flex-wrap gap-2 pt-1">
                  <a href={`tel:${order.phone}`}>
                    <Button variant="outline" size="sm">
                      <Phone className="mr-1 h-4 w-4" /> Call
                    </Button>
                  </a>
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${addressQuery}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <Button variant="outline" size="sm">
                      <Navigation className="mr-1 h-4 w-4" /> Navigate
                    </Button>
                  </a>
                </div>
              </div>

              <div className="space-y-2">
                <div className="space-y-1">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-muted-foreground">
                        {item.name} × {item.quantity}
                      </span>
                      <span>{formatLKR(item.sellingPrice * item.quantity)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-xs text-muted-foreground">
                      + {order.items.length - 3} more item(s)
                    </p>
                  )}
                </div>
              </div>
            </div>

            {actions.length > 0 && (
              <div className="border-t border-fuchsia-100 p-4 dark:border-neutral-800">
                {noteFor === order.id && (
                  <textarea
                    value={note}
                    onChange={(event) => setNote(event.target.value)}
                    placeholder="Add a note for the customer (optional)"
                    rows={2}
                    className="mb-3 w-full rounded-md border bg-background p-2 text-sm"
                  />
                )}
                <div className="flex flex-wrap gap-2">
                  {actions.map((status) => (
                    <Button
                      key={status}
                      size="sm"
                      variant={status === "FAILED" ? "outline" : "default"}
                      className={
                        status === "FAILED"
                          ? "border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30"
                          : undefined
                      }
                      disabled={busyId === order.id}
                      onClick={() => {
                        if (status === "FAILED" && noteFor !== order.id) {
                          setNoteFor(order.id);
                          setNote("");
                          return;
                        }
                        updateStatus(order, status);
                      }}
                    >
                      {busyId === order.id ? "Saving..." : ACTION_LABELS[status]}
                    </Button>
                  ))}
                </div>
              </div>
            )}
          </Card>
        );
      })}
    </div>
  );
}
