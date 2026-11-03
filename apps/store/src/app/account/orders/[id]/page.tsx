"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { formatLKR } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  MapPin,
  Package,
  Phone,
  Truck,
} from "lucide-react";

type TrackingEvent = {
  id: number;
  status: string;
  title: string;
  message?: string | null;
  createdAt: string;
};

type Order = {
  id: number;
  fullName: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  total: number;
  subtotal: number;
  shipping: number;
  status: string;
  deliveryStatus: string;
  deliveryNote?: string | null;
  paymentMethod: string;
  createdAt: string;
  currentLat?: number | null;
  currentLng?: number | null;
  locationUpdatedAt?: string | null;
  driver?: {
    id: number;
    name: string;
    phone?: string | null;
    vehicleType?: string | null;
    vehicleNumber?: string | null;
    currentLat?: number | null;
    currentLng?: number | null;
    locationUpdatedAt?: string | null;
  } | null;
  items: { id: number; name: string; quantity: number; sellingPrice: number }[];
  trackingEvents: TrackingEvent[];
};

const DELIVERY_LABELS: Record<string, string> = {
  UNASSIGNED: "Preparing your order",
  ASSIGNED: "Driver assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Delivery problem",
  CANCELLED: "Cancelled",
};

const DELIVERY_STYLES: Record<string, string> = {
  UNASSIGNED: "bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400",
  ASSIGNED: "bg-blue-50 text-blue-700 dark:bg-blue-950 dark:text-blue-400",
  PICKED_UP: "bg-indigo-50 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  OUT_FOR_DELIVERY:
    "bg-fuchsia-50 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-400",
  DELIVERED: "bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400",
  FAILED: "bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300",
};

export default function OrderTrackingPage() {
  const params = useParams<{ id: string }>();
  const orderId = params?.id;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [lastSync, setLastSync] = useState<Date | null>(null);

  const load = useCallback(
    async (silent = false) => {
      if (!orderId) return;
      if (!silent) setLoading(true);

      try {
        const res = await fetch(`/api/orders/${orderId}/tracking`, {
          cache: "no-store",
        });
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load tracking");
          return;
        }

        setOrder(data.order);
        setError("");
        setLastSync(new Date());
      } catch {
        setError("Could not load tracking");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [orderId],
  );

  useEffect(() => {
    load();
    const timer = setInterval(() => load(true), 15_000);
    return () => clearInterval(timer);
  }, [load]);

  const mapUrl = useMemo(() => {
    const lat = order?.currentLat ?? order?.driver?.currentLat;
    const lng = order?.currentLng ?? order?.driver?.currentLng;
    if (lat == null || lng == null) return null;

    const delta = 0.02;
    const bbox = [lng - delta, lat - delta, lng + delta, lat + delta].join(",");
    return `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lng}`;
  }, [order]);

  if (loading) {
    return (
      <div className="py-24 text-center text-sm text-gray-400">
        Loading your order tracking...
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-24 text-center">
        <p className="text-red-500">{error || "Order not found"}</p>
        <Link href="/account/orders" className="mt-4 inline-block">
          <Button variant="outline">Back to my orders</Button>
        </Link>
      </div>
    );
  }

  const deliveryStatus = order.deliveryStatus || "UNASSIGNED";
  const driverLat = order.currentLat ?? order.driver?.currentLat;
  const driverLng = order.currentLng ?? order.driver?.currentLng;
  const locationAt = order.locationUpdatedAt ?? order.driver?.locationUpdatedAt;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-fuchsia-600"
        >
          <ArrowLeft className="h-4 w-4" /> My orders
        </Link>
        <span className="inline-flex items-center gap-1.5 text-xs text-green-600">
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-500" />
          Live tracking · refreshed {lastSync ? lastSync.toLocaleTimeString() : "just now"}
        </span>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold sm:text-3xl">Order #{order.id}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Placed {new Date(order.createdAt).toLocaleString()}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-xs font-semibold ${
            DELIVERY_STYLES[deliveryStatus] ?? DELIVERY_STYLES.UNASSIGNED
          }`}
        >
          {DELIVERY_LABELS[deliveryStatus] ?? deliveryStatus}
        </span>
      </div>

      {/* Driver + live map */}
      {order.driver ? (
        <Card className="overflow-hidden border-fuchsia-100 dark:border-fuchsia-900/40">
          <div className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-fuchsia-600 text-white">
                <Truck className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold">{order.driver.name}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {order.driver.vehicleType || "Delivery rider"}
                  {order.driver.vehicleNumber
                    ? ` · ${order.driver.vehicleNumber}`
                    : ""}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {order.driver.phone && (
                <a href={`tel:${order.driver.phone}`}>
                  <Button variant="outline" size="sm">
                    <Phone className="mr-1 h-4 w-4" /> Call driver
                  </Button>
                </a>
              )}
              {driverLat != null && driverLng != null && (
                <a
                  href={`https://www.google.com/maps?q=${driverLat},${driverLng}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <Button variant="outline" size="sm">
                    <MapPin className="mr-1 h-4 w-4" /> Open map
                  </Button>
                </a>
              )}
            </div>
          </div>

          {mapUrl ? (
            <div className="border-t border-fuchsia-100 dark:border-fuchsia-900/40">
              <iframe
                title="Driver location"
                src={mapUrl}
                className="h-64 w-full"
                loading="lazy"
              />
              {locationAt && (
                <p className="px-4 py-2 text-[11px] text-gray-500 dark:text-gray-400">
                  Driver location updated{" "}
                  {new Date(locationAt).toLocaleTimeString()}
                </p>
              )}
            </div>
          ) : (
            <div className="border-t border-fuchsia-100 bg-fuchsia-50/50 px-4 py-3 text-xs text-gray-500 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/20 dark:text-gray-400">
              Your driver has not shared a live location yet. This area updates
              automatically once they start their trip.
            </div>
          )}
        </Card>
      ) : (
        <Card className="flex items-start gap-3 p-4 text-sm">
          <Package className="mt-0.5 h-5 w-5 text-fuchsia-500" />
          <div>
            <p className="font-semibold">A driver has not been assigned yet</p>
            <p className="text-gray-500 dark:text-gray-400">
              We are preparing your order. You will see the rider and live map
              here as soon as delivery starts.
            </p>
          </div>
        </Card>
      )}

      {/* Timeline */}
      <Card className="p-5">
        <h2 className="mb-4 font-semibold">Delivery progress</h2>
        {order.trackingEvents.length === 0 ? (
          <div className="flex gap-3 text-sm">
            <Circle className="mt-0.5 h-4 w-4 text-gray-300" />
            <div>
              <p className="font-medium">Order confirmed</p>
              <p className="text-gray-500 dark:text-gray-400">
                Waiting for the store to prepare your items.
              </p>
            </div>
          </div>
        ) : (
          <ol className="space-y-4">
            {order.trackingEvents.map((event, index) => {
              const isLatest = index === order.trackingEvents.length - 1;
              return (
                <li key={event.id} className="flex gap-3">
                  <span className="relative flex w-4 shrink-0 justify-center">
                    {isLatest ? (
                      <CheckCircle2 className="h-4 w-4 text-fuchsia-600" />
                    ) : (
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-fuchsia-200 dark:bg-fuchsia-900" />
                    )}
                    {index < order.trackingEvents.length - 1 && (
                      <span className="absolute top-5 h-full w-px bg-fuchsia-100 dark:bg-fuchsia-900/60" />
                    )}
                  </span>
                  <div className="pb-1 text-sm">
                    <p className={isLatest ? "font-semibold" : "font-medium"}>
                      {event.title}
                    </p>
                    {event.message && (
                      <p className="text-gray-500 dark:text-gray-400">{event.message}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      {new Date(event.createdAt).toLocaleString()}
                    </p>
                  </div>
                </li>
              );
            })}
          </ol>
        )}

        {order.deliveryNote && (
          <p className="mt-4 rounded-md bg-gray-50 px-3 py-2 text-sm text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
            <span className="font-medium">Note from the driver: </span>
            {order.deliveryNote}
          </p>
        )}
      </Card>

      {/* Products + delivery details */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Your items</h2>
          <div className="space-y-2 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-gray-600 dark:text-gray-400">
                  {item.name} × {item.quantity}
                </span>
                <span className="font-medium">
                  {formatLKR(item.sellingPrice * item.quantity)}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-3 space-y-1 border-t pt-3 text-sm">
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Subtotal</span>
              <span>{formatLKR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-gray-500 dark:text-gray-400">
              <span>Shipping</span>
              <span>{formatLKR(order.shipping)}</span>
            </div>
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatLKR(order.total)}</span>
            </div>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 font-semibold">Delivery address</h2>
          <div className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
            <p className="font-medium text-gray-900 dark:text-gray-100">
              {order.fullName}
            </p>
            <p>{order.phone}</p>
            <p>
              {order.address}, {order.city} {order.postalCode}
            </p>
            <p className="pt-2 capitalize">
              Payment:{" "}
              {order.paymentMethod === "cod" ? "Cash on delivery" : "Card"}
            </p>
          </div>
        </Card>
      </div>
    </div>
  );
}
