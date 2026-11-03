import { redirect } from "next/navigation";
import Link from "next/link";
import { Card } from "@online-store/ui/card";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/lib/delivery";
import { DriverOrder } from "@/lib/types";
import DeliveriesList from "@/components/DeliveriesList";
import AvailabilityToggle from "@/components/AvailabilityToggle";

export const dynamic = "force-dynamic";

function startOfToday() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date;
}

export default async function DriverDashboardPage() {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  const [driver, activeOrders, deliveredToday, activeCount] = await Promise.all([
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
  ]);

  if (!driver) redirect("/login");

  const orders = JSON.parse(JSON.stringify(activeOrders)) as DriverOrder[];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">
            Hi, {driver.name.split(" ")[0]} 👋
          </h1>
          <p className="text-sm text-muted-foreground">
            {activeCount > 0
              ? `You have ${activeCount} active deliver${activeCount === 1 ? "y" : "ies"}.`
              : "You have no active deliveries."}
          </p>
        </div>
        <AvailabilityToggle available={driver.isAvailable && driver.status === "ACTIVE"} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Active deliveries</p>
          <p className="text-2xl font-bold">{activeCount}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Delivered today</p>
          <p className="text-2xl font-bold">{deliveredToday}</p>
        </Card>
        <Card className="col-span-2 p-4 sm:col-span-1">
          <p className="text-xs text-muted-foreground">Next stop</p>
          <p className="truncate text-sm font-semibold">
            {orders[0] ? `#${orders[0].id} · ${orders[0].city}` : "No active jobs"}
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {orders[0] ? DELIVERY_LABELS[orders[0].deliveryStatus as DeliveryStatus] : "—"}
          </p>
        </Card>
      </div>

      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">My deliveries</h2>
        <Link
          href="/dashboard/history"
          className="text-sm font-medium text-fuchsia-700 hover:underline dark:text-fuchsia-300"
        >
          View history
        </Link>
      </div>

      <DeliveriesList orders={orders} />
    </div>
  );
}
