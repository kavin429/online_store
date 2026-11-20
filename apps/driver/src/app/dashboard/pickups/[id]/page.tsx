import { notFound, redirect } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { StatusBadge } from "@online-store/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { formatLKR } from "@/lib/utils";
import { MapPin, Package, Phone } from "lucide-react";
import PageHeader from "@/components/PageHeader";
import LiveMap from "@/components/LiveMap";

export const dynamic = "force-dynamic";

function quotationRef(id: number) {
  return `QT-${String(id).padStart(5, "0")}`;
}

export default async function PickupDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const quotation = await prisma.quotation.findFirst({
    where: { id, driverId: auth.id },
    include: {
      vendor: { select: { name: true, phone: true, address: true, city: true } },
      items: { orderBy: { id: "asc" } },
      events: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!quotation) notFound();

  const address = [quotation.vendor.address, quotation.vendor.city]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="space-y-6">
      <PageHeader
        backHref="/dashboard/history"
        backLabel="Back to history"
        eyebrow="Stock pickup"
        title={quotationRef(quotation.id)}
        description={`Stock pickup from ${quotation.vendor.name}`}
        actions={<StatusBadge status={quotation.status} />}
      />

      <LiveMap
        destination={address || quotation.vendor.name}
        title="Getting there"
        description="Open directions to reach the vendor for this pickup."
        emptyMessage="This pickup has no shared GPS position yet."
      />

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-3 rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
          <p className="flex items-center gap-2 font-semibold">
            <MapPin className="h-4 w-4 text-fuchsia-600" /> Vendor
          </p>
          <div className="text-sm">
            <p className="font-medium">{quotation.vendor.name}</p>
            {address && (
              <p className="mt-1 flex items-start gap-1.5 text-muted-foreground">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                <span>{address}</span>
              </p>
            )}
            {quotation.vendor.phone && (
              <p className="mt-1 text-muted-foreground">{quotation.vendor.phone}</p>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {quotation.vendor.phone && (
              <a href={`tel:${quotation.vendor.phone}`}>
                <span className="inline-flex items-center gap-1 rounded-lg border px-3 py-1.5 text-sm font-medium transition hover:bg-fuchsia-50 dark:hover:bg-neutral-800">
                  <Phone className="h-4 w-4" /> Call
                </span>
              </a>
            )}
          </div>
        </Card>

        <Card className="space-y-2 rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
          <p className="flex items-center gap-2 font-semibold">
            <Package className="h-4 w-4 text-fuchsia-600" /> Stock items
          </p>
          <div className="space-y-1.5 text-sm">
            {quotation.items.map((item) => (
              <div key={item.id} className="flex justify-between gap-3">
                <span className="min-w-0 truncate text-muted-foreground">
                  {item.name} × {item.quantity}
                </span>
                {item.quotedUnitPrice != null && (
                  <span className="shrink-0">
                    {formatLKR(item.quotedUnitPrice * item.quantity)}
                  </span>
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between border-t pt-2 text-sm font-semibold">
            <span>Total</span>
            <span>{formatLKR(quotation.acceptedTotal ?? quotation.quotedTotal)}</span>
          </div>
        </Card>
      </div>

      <Card className="rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
        <p className="mb-3 font-semibold">Pickup details</p>
        <dl className="grid gap-4 text-sm sm:grid-cols-3">
          <div>
            <dt className="text-xs text-muted-foreground">Assigned</dt>
            <dd>
              {quotation.assignedAt
                ? new Date(quotation.assignedAt).toLocaleString()
                : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Picked up</dt>
            <dd>
              {quotation.pickedUpAt
                ? new Date(quotation.pickedUpAt).toLocaleString()
                : "Not yet"}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-muted-foreground">Received by store</dt>
            <dd>
              {quotation.receivedAt
                ? new Date(quotation.receivedAt).toLocaleString()
                : "Not yet"}
            </dd>
          </div>
        </dl>
        {quotation.requestNote && (
          <p className="mt-4 rounded-xl bg-gray-100 p-3 text-sm text-gray-700 dark:bg-neutral-800 dark:text-gray-300">
            <span className="font-medium">Request note: </span>
            {quotation.requestNote}
          </p>
        )}
      </Card>

      <Card className="rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
        <p className="mb-4 font-semibold">Pickup history</p>
        {quotation.events.length === 0 ? (
          <p className="text-sm text-muted-foreground">No updates recorded yet.</p>
        ) : (
          <ol className="relative space-y-4 before:absolute before:left-[5px] before:top-2 before:h-[calc(100%-1rem)] before:w-px before:bg-fuchsia-100 dark:before:bg-fuchsia-900/50">
            {quotation.events.map((event) => (
              <li key={event.id} className="relative flex gap-3">
                <span className="relative z-10 mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-fuchsia-500 ring-4 ring-fuchsia-50 dark:ring-fuchsia-950/40" />
                <div className="min-w-0 text-sm">
                  <p className="font-medium">{event.title}</p>
                  {event.message && (
                    <p className="break-words text-muted-foreground">{event.message}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {event.actor} · {new Date(event.createdAt).toLocaleString()}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </Card>
    </div>
  );
}
