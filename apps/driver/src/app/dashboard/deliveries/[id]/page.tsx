import { notFound, redirect } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { StatusBadge } from "@online-store/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/lib/delivery";
import { formatLKR } from "@/lib/utils";
import { Banknote, MapPin, Phone, UserRound } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LiveMap from "@/components/LiveMap";
import DeliveryActions from "@/components/DeliveryActions";
import LocationTracker from "@/components/LocationTracker";

export const dynamic = "force-dynamic";

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

  const address = `${order.address}, ${order.city} ${order.postalCode}`;
  const status = order.deliveryStatus as DeliveryStatus;

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard"
        backLabel="Back to deliveries"
        eyebrow="Delivery job"
        title={`Order #${order.id}`}
        description={`Placed ${new Date(order.createdAt).toLocaleString()} · ${
          order.paymentMethod === "cod" ? "Collect cash on delivery" : "Already paid by card"
        }`}
        actions={
          <StatusBadge status={status} label={DELIVERY_LABELS[status]} />
        }
      />

      <LiveMap
        deliveryId={order.id}
        destination={address}
        lat={order.currentLat}
        lng={order.currentLng}
        updatedAt={order.locationUpdatedAt?.toISOString() ?? null}
        title="Map & route"
        description="Open directions for the customer's address, or share your live position."
      />

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <DeliveryActions deliveryId={order.id} status={status} />
          <LocationTracker
            deliveryId={order.id}
            initialLat={order.currentLat}
            initialLng={order.currentLng}
            lastUpdated={order.locationUpdatedAt?.toISOString() ?? null}
          />

          <Card className="rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
            <p className="mb-4 font-semibold">Tracking timeline</p>
            {order.trackingEvents.length === 0 ? (
              <p className="text-sm text-muted-foreground">No updates yet.</p>
            ) : (
              <ol className="relative space-y-4 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-fuchsia-100 dark:before:bg-fuchsia-900/50">
                {order.trackingEvents.map((event) => (
                  <li key={event.id} className="relative flex gap-3 pl-0">
                    <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-500 ring-4 ring-fuchsia-50 dark:ring-fuchsia-950/40" />
                    <div className="min-w-0 text-sm">
                      <p className="font-medium">{event.title}</p>
                      {event.message && (
                        <p className="break-words text-muted-foreground">{event.message}</p>
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
        </div>

        <aside className="space-y-5">
          <Card className="space-y-3 rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
            <p className="flex items-center gap-2 font-semibold">
              <UserRound className="h-4 w-4 text-fuchsia-600" /> Customer
            </p>
            <div className="text-sm">
              <p className="font-medium">{order.fullName}</p>
              <p className="text-muted-foreground">{order.phone}</p>
              <p className="mt-2 flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                <span>{address}</span>
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <a href={`tel:${order.phone}`}>
                <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-fuchsia-50 dark:hover:bg-neutral-800">
                  <Phone className="h-4 w-4" /> Call
                </span>
              </a>
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`}
                target="_blank"
                rel="noreferrer"
              >
                <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-fuchsia-50 dark:hover:bg-neutral-800">
                  <MapPin className="h-4 w-4" /> Search address
                </span>
              </a>
            </div>
          </Card>

          <Card className="space-y-2 rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
            <p className="font-semibold">Order items</p>
            <div className="space-y-1.5 text-sm">
              {order.items.map((item) => (
                <div key={item.id} className="flex justify-between gap-3">
                  <span className="min-w-0 truncate text-muted-foreground">
                    {item.name} × {item.quantity}
                  </span>
                  <span className="shrink-0">{formatLKR(item.sellingPrice * item.quantity)}</span>
                </div>
              ))}
            </div>
            <div className="flex justify-between border-t pt-2 text-sm font-semibold">
              <span>Total</span>
              <span>{formatLKR(order.total)}</span>
            </div>
            {order.paymentMethod === "cod" && (
              <p className="flex items-center gap-2 rounded-lg bg-amber-50 px-2.5 py-2 text-xs font-medium text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">
                <Banknote className="h-4 w-4 shrink-0" />
                Collect {formatLKR(order.total)} in cash.
              </p>
            )}
          </Card>

          {order.deliveryNote && (
            <p className="rounded-xl bg-gray-100 p-3 text-sm text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
              <span className="font-medium">Last note: </span>
              {order.deliveryNote}
            </p>
          )}
        </aside>
      </div>
    </div>
  );
}
