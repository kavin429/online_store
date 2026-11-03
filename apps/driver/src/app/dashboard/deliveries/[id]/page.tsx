import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { Badge } from "@online-store/ui/badge";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/lib/delivery";
import { formatLKR } from "@/lib/utils";
import { ArrowLeft, MapPin, Phone, UserRound } from "lucide-react";
import DeliveryActions from "@/components/DeliveryActions";
import LocationTracker from "@/components/LocationTracker";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<DeliveryStatus, string> = {
  UNASSIGNED: "bg-gray-100 text-gray-600",
  ASSIGNED: "bg-blue-100 text-blue-700",
  PICKED_UP: "bg-indigo-100 text-indigo-700",
  OUT_FOR_DELIVERY: "bg-fuchsia-100 text-fuchsia-700",
  DELIVERED: "bg-green-100 text-green-700",
  FAILED: "bg-red-100 text-red-700",
  CANCELLED: "bg-gray-200 text-gray-700",
};

export default async function DeliveryDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const order = await prisma.order.findFirst({
    where: { id, driverId: auth.id },
    include: {
      items: true,
      trackingEvents: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!order) notFound();

  const addressQuery = encodeURIComponent(
    `${order.address}, ${order.city} ${order.postalCode}`,
  );
  const status = order.deliveryStatus as DeliveryStatus;

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 hover:text-fuchsia-700 dark:text-gray-400"
        >
          <ArrowLeft className="h-4 w-4" /> Back to deliveries
        </Link>
        <Badge className={`border-0 ${STATUS_STYLES[status]}`}>
          {DELIVERY_LABELS[status]}
        </Badge>
      </div>

      <div>
        <h1 className="text-2xl font-bold">Order #{order.id}</h1>
        <p className="text-sm text-muted-foreground">
          Placed {new Date(order.createdAt).toLocaleString()} ·{" "}
          {order.paymentMethod === "cod" ? "Collect cash on delivery" : "Already paid by card"}
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="space-y-3 p-4">
          <p className="flex items-center gap-2 font-semibold">
            <UserRound className="h-4 w-4 text-fuchsia-600" /> Customer
          </p>
          <div className="text-sm">
            <p className="font-medium">{order.fullName}</p>
            <p className="text-muted-foreground">{order.phone}</p>
            <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {order.address}, {order.city} {order.postalCode}
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <a href={`tel:${order.phone}`}>
              <span className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800">
                <Phone className="h-4 w-4" /> Call
              </span>
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${addressQuery}`}
              target="_blank"
              rel="noreferrer"
            >
              <span className="inline-flex items-center gap-1 rounded-md border px-3 py-1.5 text-sm font-medium hover:bg-gray-50 dark:hover:bg-neutral-800">
                <MapPin className="h-4 w-4" /> Navigate
              </span>
            </a>
          </div>
        </Card>

        <Card className="space-y-2 p-4">
          <p className="font-semibold">Order items</p>
          <div className="space-y-1.5 text-sm">
            {order.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="text-muted-foreground">
                  {item.name} × {item.quantity}
                </span>
                <span>{formatLKR(item.sellingPrice * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Total</span>
            <span>{formatLKR(order.total)}</span>
          </div>
          {order.paymentMethod === "cod" && (
            <p className="rounded-md bg-amber-50 px-2 py-1.5 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
              Collect {formatLKR(order.total)} in cash.
            </p>
          )}
        </Card>
      </div>

      <DeliveryActions deliveryId={order.id} status={status} />

      <LocationTracker
        deliveryId={order.id}
        initialLat={order.currentLat}
        initialLng={order.currentLng}
        lastUpdated={order.locationUpdatedAt?.toISOString() ?? null}
      />

      <Card className="p-4">
        <p className="mb-3 font-semibold">Tracking timeline</p>
        {order.trackingEvents.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates yet.</p>
        ) : (
          <ol className="space-y-3">
            {order.trackingEvents.map((event) => (
              <li key={event.id} className="flex gap-3">
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-500" />
                <div className="text-sm">
                  <p className="font-medium">{event.title}</p>
                  {event.message && (
                    <p className="text-muted-foreground">{event.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>

      {order.deliveryNote && (
        <p className="rounded-lg bg-gray-100 p-3 text-sm text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
          <span className="font-medium">Last note: </span>
          {order.deliveryNote}
        </p>
      )}
    </div>
  );
}
