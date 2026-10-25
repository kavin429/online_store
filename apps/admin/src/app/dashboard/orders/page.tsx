import OrderMain from "@/components/orders/main";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: { id: true, name: true, email: true, image: true },
      },
      items: true,
    },
  });

  return <OrderMain data={JSON.parse(JSON.stringify(orders))} />;
}