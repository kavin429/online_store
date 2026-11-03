import OrderMain from "@/components/orders/main";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      driver: {
        select: {
          id: true,
          name: true,
          username: true,
          phone: true,
          vehicleType: true,
          vehicleNumber: true,
          status: true,
          isAvailable: true,
        },
      },
      items: true,
      trackingEvents: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });

  return <OrderMain data={JSON.parse(JSON.stringify(orders))} />;
}