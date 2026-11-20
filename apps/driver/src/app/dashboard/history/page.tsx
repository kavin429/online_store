import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { StatusBadge } from "@online-store/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/lib/delivery";
import { cn, formatLKR } from "@/lib/utils";
import { ArrowUpRight, History, Package, Truck } from "lucide-react";
import PageHeader from "@/components/PageHeader";

export const dynamic = "force-dynamic";

type View = "all" | "deliveries" | "pickups";

type HistoryRecord = {
  key: string;
  kind: "delivery" | "pickup";
  ref: string;
  status: string;
  statusLabel?: string;
  subject: string;
  itemCount: number;
  total: number;
  activityAt: Date;
  latestEvent: { title: string; createdAt: Date } | null;
  href: string;
};

function quotationRef(id: number) {
  return `QT-${String(id).padStart(5, "0")}`;
}

export default async function DeliveryHistoryPage({
  searchParams,
}: {
  searchParams: { view?: string };
}) {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  // Show past/closed records only. Active jobs already appear on the dashboard.
  const [orders, quotations] = await Promise.all([
    prisma.order.findMany({
      where: {
        driverId: auth.id,
        deliveryStatus: { notIn: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
      },
      include: {
        items: true,
        trackingEvents: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.quotation.findMany({
      where: {
        driverId: auth.id,
        NOT: { status: "DRIVER_ASSIGNED" },
      },
      include: {
        vendor: { select: { name: true, city: true } },
        items: true,
        events: { orderBy: { createdAt: "desc" }, take: 1 },
      },
      orderBy: { updatedAt: "desc" },
    }),
  ]);

  const deliveries: HistoryRecord[] = orders.map((order) => {
    const status = order.deliveryStatus as DeliveryStatus;
    const latest = order.trackingEvents[0];

    return {
      key: `order-${order.id}`,
      kind: "delivery",
      ref: `Order #${order.id}`,
      status,
      statusLabel: DELIVERY_LABELS[status] ?? status,
      subject: `${order.fullName} · ${order.city}`,
      itemCount: order.items.reduce((sum, item) => sum + item.quantity, 0),
      total: order.total,
      activityAt: order.deliveredAt ?? order.updatedAt,
      latestEvent: latest
        ? { title: latest.title, createdAt: latest.createdAt }
        : null,
      href: `/dashboard/deliveries/${order.id}`,
    };
  });

  const pickups: HistoryRecord[] = quotations.map((quotation) => {
    const latest = quotation.events[0];

    return {
      key: `quotation-${quotation.id}`,
      kind: "pickup",
      ref: quotationRef(quotation.id),
      status: quotation.status,
      subject: `${quotation.vendor.name}${quotation.vendor.city ? ` · ${quotation.vendor.city}` : ""}`,
      itemCount: quotation.items.reduce((sum, item) => sum + item.quantity, 0),
      total: quotation.quotedTotal,
      activityAt: quotation.pickedUpAt ?? quotation.assignedAt ?? quotation.updatedAt,
      latestEvent: latest
        ? { title: latest.title, createdAt: latest.createdAt }
        : null,
      href: `/dashboard/pickups/${quotation.id}`,
    };
  });

  const records = [...deliveries, ...pickups].sort(
    (a, b) => b.activityAt.getTime() - a.activityAt.getTime(),
  );

  const view: View =
    searchParams.view === "deliveries" || searchParams.view === "pickups"
      ? searchParams.view
      : "all";
  const visible =
    view === "all"
      ? records
      : records.filter((record) => record.kind === (view === "deliveries" ? "delivery" : "pickup"));

  const tabs: { key: View; label: string; count: number }[] = [
    { key: "all", label: "All records", count: records.length },
    { key: "deliveries", label: "Deliveries", count: deliveries.length },
    { key: "pickups", label: "Stock pickups", count: pickups.length },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Your records"
        title="History & records"
        description="Completed deliveries and past stock pickups assigned to you. Active jobs are shown on your dashboard."
      />

      <div className="flex flex-wrap gap-2">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={tab.key === "all" ? "/dashboard/history" : `/dashboard/history?view=${tab.key}`}
            className={cn(
              "rounded-full border px-4 py-2 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500",
              view === tab.key
                ? "border-fuchsia-600 bg-fuchsia-600 text-white"
                : "border-fuchsia-100 bg-white text-gray-600 hover:border-fuchsia-300 hover:text-fuchsia-700 dark:border-neutral-800 dark:bg-neutral-900 dark:text-gray-300",
            )}
          >
            {tab.label} ({tab.count})
          </Link>
        ))}
      </div>

      {visible.length === 0 ? (
        <Card className="rounded-2xl border-fuchsia-100/70 p-10 text-center dark:border-fuchsia-900/30">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
            <History className="h-7 w-7" />
          </span>
          <p className="font-semibold">No history yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Completed deliveries and past pickups will appear here once you finish a job.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((record) => {
            const Icon = record.kind === "delivery" ? Truck : Package;

            return (
              <Link key={record.key} href={record.href} className="block">
                <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-fuchsia-100/70 p-4 transition hover:-translate-y-0.5 hover:border-fuchsia-300 hover:shadow-md dark:border-fuchsia-900/30">
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
                      <Icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="font-semibold">{record.ref}</p>
                        <StatusBadge status={record.status} label={record.statusLabel} />
                        <span className="rounded-full bg-gray-100 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-gray-600 dark:bg-neutral-800 dark:text-gray-300">
                          {record.kind === "delivery" ? "Delivery" : "Stock pickup"}
                        </span>
                      </div>
                      <p className="truncate text-sm text-muted-foreground">
                        {record.subject} · {record.itemCount} item
                        {record.itemCount === 1 ? "" : "s"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {record.latestEvent
                          ? `${record.latestEvent.title} · ${new Date(record.latestEvent.createdAt).toLocaleString()}`
                          : `Updated ${new Date(record.activityAt).toLocaleString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold">{formatLKR(record.total)}</p>
                    <ArrowUpRight className="h-4 w-4 text-fuchsia-500" />
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
