"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { StatusBadge } from "@online-store/ui/status-badge";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { toast } from "sonner";
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Navigation,
  Package,
  Phone,
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

function directionsUrl(order: DriverOrder) {
  const destination =
    order.currentLat != null && order.currentLng != null
      ? `${order.currentLat},${order.currentLng}`
      : encodeURIComponent(`${order.address}, ${order.city} ${order.postalCode}`);
  return `https://www.google.com/maps/dir/?api=1&destination=${destination}`;
}

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
          note: noteFor === order.id ? note.trim() || undefined : undefined,
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
      <Card className="rounded-2xl border-fuchsia-100/70 p-10 text-center dark:border-fuchsia-900/30">
        <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
          <ShoppingBag className="h-7 w-7" />
        </span>
        <h3 className="text-lg font-semibold">No deliveries right now</h3>
        <p className="mx-auto mt-1 max-w-sm text-sm text-muted-foreground">
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
        const itemCount = order.items.reduce((sum, item) => sum + item.quantity, 0);

        return (
          <Card
            key={order.id}
            className="overflow-hidden rounded-2xl border-fuchsia-100/70 transition hover:shadow-md dark:border-fuchsia-900/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-fuchsia-100/70 bg-fuchsia-50/60 p-4 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20">
              <div className="flex items-start gap-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-fuchsia-600 shadow-sm dark:bg-neutral-900 dark:text-fuchsia-300">
                  <Package className="h-5 w-5" />
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
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
              </div>

              <Link
                href={`/dashboard/deliveries/${order.id}`}
                className="inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-100 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/50"
              >
                Details <ChevronRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="font-medium">{order.fullName}</p>
                <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
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
                  <a href={directionsUrl(order)} target="_blank" rel="noreferrer">
                    <Button variant="outline" size="sm">
                      <Navigation className="mr-1 h-4 w-4" /> Navigate
                    </Button>
                  </a>
                  <Link href={`/dashboard/deliveries/${order.id}`}>
                    <Button variant="ghost" size="sm">
                      Live map <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-1 rounded-xl bg-gray-50 p-3 dark:bg-neutral-900">
                {order.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span className="truncate text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                    <span className="shrink-0">{formatLKR(item.sellingPrice * item.quantity)}</span>
                  </div>
                ))}
                {order.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {order.items.length - 3} more item(s)
                  </p>
                )}
              </div>
            </div>

            {actions.length > 0 && (
              <div className="border-t border-fuchsia-100/70 p-4 dark:border-fuchsia-900/30">
                {noteFor === order.id && (
                  <div className="mb-3 space-y-1.5">
                    <label
                      htmlFor={`note-${order.id}`}
                      className="text-xs font-medium text-muted-foreground"
                    >
                      Reason for reporting a problem
                    </label>
                    <textarea
                      id={`note-${order.id}`}
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      placeholder="e.g. Customer was not reachable"
                      rows={2}
                      className="w-full rounded-xl border bg-background p-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
                    />
                  </div>
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
