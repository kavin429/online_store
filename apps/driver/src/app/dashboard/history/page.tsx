import Link from "next/link";
import { redirect } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { StatusBadge } from "@online-store/ui/status-badge";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import { DELIVERY_LABELS, type DeliveryStatus } from "@/lib/delivery";
import { formatLKR } from "@/lib/utils";
import { History } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DeliveryHistoryPage() {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  const orders = await prisma.order.findMany({
    where: {
      driverId: auth.id,
      deliveryStatus: { in: ["DELIVERED", "FAILED", "CANCELLED"] },
    },
    include: { items: true },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Delivery history</h1>
        <p className="text-sm text-muted-foreground">
          Completed and closed deliveries assigned to you.
        </p>
      </div>

      {orders.length === 0 ? (
        <Card className="p-10 text-center">
          <History className="mx-auto mb-3 h-12 w-12 text-fuchsia-200" />
          <p className="font-semibold">No delivery history yet</p>
          <p className="text-sm text-muted-foreground">
            Completed deliveries will show up here.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => {
            const status = order.deliveryStatus as DeliveryStatus;
            const count = order.items.reduce((sum, item) => sum + item.quantity, 0);

            return (
              <Link key={order.id} href={`/dashboard/deliveries/${order.id}`}>
                <Card className="flex flex-wrap items-center justify-between gap-3 p-4 transition-colors hover:border-fuchsia-300">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold">Order #{order.id}</p>
                      <StatusBadge
                        status={status}
                        label={DELIVERY_LABELS[status]}
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {order.fullName} · {order.city} · {count} item
                      {count === 1 ? "" : "s"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.deliveredAt
                        ? `Delivered ${new Date(order.deliveredAt).toLocaleString()}`
                        : `Updated ${new Date(order.updatedAt).toLocaleString()}`}
                    </p>
                  </div>
                  <p className="font-semibold">{formatLKR(order.total)}</p>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
