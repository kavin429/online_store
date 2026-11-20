import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@online-store/ui/card";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/lib/delivery";
import { DriverOrder } from "@/lib/types";
import DeliveriesList from "@/components/DeliveriesList";
import AvailabilityToggle from "@/components/AvailabilityToggle";
import QuotationPickupsList, { type DriverQuotation } from "@/components/QuotationPickupsList";
import {
  ArrowUpRight,
  CheckCircle2,
  ClipboardCheck,
  MapPin,
  Package,
  Sparkles,
  Truck,
} from "lucide-react";

export const dynamic = "force-dynamic";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

function quotationRef(id: number) {
  return `QT-${String(id).padStart(5, "0")}`;
}

function assignedTime(value: string | null | undefined) {
  if (!value) return Number.POSITIVE_INFINITY;
  const time = new Date(value).getTime();
  return Number.isNaN(time) ? Number.POSITIVE_INFINITY : time;
}

const STAT_CARDS = [
  { key: "active", label: "Active deliveries", icon: Truck, tone: "text-fuchsia-600 bg-fuchsia-100 dark:bg-fuchsia-950/60 dark:text-fuchsia-300" },
  { key: "pickups", label: "Stock pickups", icon: Package, tone: "text-amber-600 bg-amber-100 dark:bg-amber-950/50 dark:text-amber-300" },
  { key: "delivered", label: "Delivered today", icon: CheckCircle2, tone: "text-green-600 bg-green-100 dark:bg-green-950/50 dark:text-green-300" },
  { key: "pickedUp", label: "Pickups done", icon: ClipboardCheck, tone: "text-blue-600 bg-blue-100 dark:bg-blue-950/50 dark:text-blue-300" },
] as const;

export default async function DriverDashboardPage() {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  const [driver, activeOrders, deliveredToday, activeCount, pickedUpCount, lastPickedUp, quotationPickups] =
    await Promise.all([
      prisma.driver.findUnique({
        where: { id: auth.id },
        select: { name: true, isAvailable: true, status: true },
      }),
      prisma.order.findMany({
        where: {
          driverId: auth.id,
          deliveryStatus: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
        },
        include: { items: true },
        orderBy: { assignedAt: "asc" },
      }),
      prisma.order.count({
        where: {
          driverId: auth.id,
          deliveryStatus: "DELIVERED",
          deliveredAt: { gte: startOfToday() },
        },
      }),
      prisma.order.count({
        where: {
          driverId: auth.id,
          deliveryStatus: { in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"] },
        },
      }),
      prisma.quotation.count({
        where: {
          driverId: auth.id,
          pickedUpAt: { not: null },
        },
      }),
      prisma.quotation.findFirst({
        where: { driverId: auth.id, pickedUpAt: { not: null } },
        orderBy: { pickedUpAt: "desc" },
        select: {
          id: true,
          vendor: { select: { name: true } },
        },
      }),
      prisma.quotation.findMany({
        where: { driverId: auth.id, status: "DRIVER_ASSIGNED" },
        include: {
          vendor: { select: { name: true, phone: true, address: true, city: true } },
          items: { select: { id: true, name: true, quantity: true } },
        },
        orderBy: { assignedAt: "asc" },
      }),
    ]);

  if (!driver) redirect("/login");

  const orders = JSON.parse(JSON.stringify(activeOrders)) as DriverOrder[];
  const pickups = JSON.parse(JSON.stringify(quotationPickups)) as DriverQuotation[];
  const pickupCount = pickups.length;

  // The next job can be either an order delivery or a stock pickup: use the
  // earliest assignment instead of always preferring orders.
  const nextOrder = orders[0];
  const nextPickup = pickups[0];
  const orderStop = nextOrder
    ? {
        heading: "Next delivery",
        label: `#${nextOrder.id} · ${nextOrder.city}`,
        status: DELIVERY_LABELS[nextOrder.deliveryStatus as DeliveryStatus],
        href: `/dashboard/deliveries/${nextOrder.id}`,
      }
    : null;
  const pickupStop = nextPickup
    ? {
        heading: "Next pickup",
        label: `${quotationRef(nextPickup.id)} · ${nextPickup.vendor.name}`,
        status: "Ready for pickup",
        href: `/dashboard/pickups/${nextPickup.id}`,
      }
    : null;
  const activeStop =
    !orderStop
      ? pickupStop
      : !pickupStop || assignedTime(nextOrder?.assignedAt) <= assignedTime(nextPickup?.assignedAt)
        ? orderStop
        : pickupStop;
  const nextStop =
    activeStop ??
    (lastPickedUp
      ? {
          heading: "Last pickup",
          label: `${quotationRef(lastPickedUp.id)} · ${lastPickedUp.vendor.name}`,
          status: "Picked up",
          href: `/dashboard/pickups/${lastPickedUp.id}`,
        }
      : null);

  const stats: Record<(typeof STAT_CARDS)[number]["key"], number> = {
    active: activeCount,
    pickups: pickupCount,
    delivered: deliveredToday,
    pickedUp: pickedUpCount,
  };

  return (
    <div className="space-y-8">
      <section className="relative overflow-hidden rounded-3xl border border-fuchsia-100 bg-gradient-to-br from-fuchsia-50 via-white to-purple-50 p-6 shadow-sm dark:border-fuchsia-900/40 dark:from-fuchsia-950/30 dark:via-neutral-950 dark:to-purple-950/20 sm:p-8">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-fuchsia-200/40 blur-3xl dark:bg-fuchsia-700/20"
        />
        <div className="relative flex flex-wrap items-start justify-between gap-5">
          <div className="space-y-2">
            <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-fuchsia-700 dark:text-fuchsia-400">
              <Sparkles className="h-3.5 w-3.5" />
              {new Date().toLocaleDateString(undefined, {
                weekday: "long",
                month: "long",
                day: "numeric",
              })}
            </p>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              Hi, {driver.name.split(" ")[0]} 👋
            </h1>
            <p className="max-w-xl text-sm text-muted-foreground">
              {activeCount + pickupCount > 0
                ? `You have ${activeCount} active deliver${activeCount === 1 ? "y" : "ies"}${pickupCount > 0 ? ` and ${pickupCount} stock pickup${pickupCount === 1 ? "" : "s"}` : ""}.`
                : pickedUpCount > 0
                  ? `You have ${pickedUpCount} completed pickup${pickedUpCount === 1 ? "" : "s"}. No active jobs right now.`
                  : "You have no active jobs. Stay online to get assigned new ones."}
            </p>
          </div>
          <AvailabilityToggle available={driver.isAvailable && driver.status === "ACTIVE"} />
        </div>

        {nextStop && (
          <Link
            href={nextStop.href}
            className="relative mt-6 flex w-full items-center justify-between gap-3 rounded-2xl border border-fuchsia-100 bg-white/80 px-4 py-3 transition hover:border-fuchsia-300 hover:shadow-sm dark:border-fuchsia-900/40 dark:bg-neutral-900/80"
          >
            <span className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300">
                <MapPin className="h-4 w-4" />
              </span>
              <span className="min-w-0">
                <span className="block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {nextStop.heading}
                </span>
                <span className="block truncate text-sm font-semibold">{nextStop.label}</span>
              </span>
            </span>
            <span className="flex shrink-0 items-center gap-2 text-xs font-medium text-fuchsia-700 dark:text-fuchsia-300">
              {nextStop.status} <ArrowUpRight className="h-4 w-4" />
            </span>
          </Link>
        )}
      </section>

      <section className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {STAT_CARDS.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card
              key={stat.key}
              className="flex items-center gap-3 rounded-2xl border-fuchsia-100/70 p-4 transition hover:-translate-y-0.5 hover:shadow-md dark:border-fuchsia-900/30"
            >
              <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${stat.tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <div className="min-w-0">
                <p className="text-2xl font-bold leading-none">{stats[stat.key]}</p>
                <p className="mt-1 truncate text-[11px] text-muted-foreground">{stat.label}</p>
              </div>
            </Card>
          );
        })}
        <Card className="hidden rounded-2xl border-fuchsia-100/70 p-4 lg:block dark:border-fuchsia-900/30">
          <p className="text-[11px] font-medium text-muted-foreground">Keep the app open</p>
          <p className="mt-2 text-sm font-semibold">Live updates on</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            New jobs arrive here instantly.
          </p>
        </Card>
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold tracking-tight">Your jobs</h2>
            <p className="text-xs text-muted-foreground">
              Stock pickups and deliveries assigned to you.
            </p>
          </div>
          <Link
            href="/dashboard/history"
            className="inline-flex items-center gap-1 text-sm font-medium text-fuchsia-700 hover:underline dark:text-fuchsia-300"
          >
            View history <ArrowUpRight className="h-4 w-4" />
          </Link>
        </div>

        <QuotationPickupsList quotations={pickups} />
        <DeliveriesList orders={orders} />
      </section>
    </div>
  );
}
