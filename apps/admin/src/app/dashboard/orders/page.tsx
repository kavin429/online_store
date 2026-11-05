import OrdersTabs from "@/components/orders/tabs";
import { prisma } from "@/lib/prisma";

export default async function OrdersPage() {
  const [orders, quotations, vendors, products, drivers] = await Promise.all([
    prisma.order.findMany({
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
    }),
    prisma.quotation.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        vendor: { select: { id: true, name: true, email: true, phone: true } },
        admin: { select: { id: true, name: true, email: true } },
        driver: {
          select: {
            id: true,
            name: true,
            username: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            status: true,
          },
        },
        items: { orderBy: { id: "asc" } },
        events: { orderBy: { createdAt: "desc" } },
      },
    }),
    prisma.vendor.findMany({
      select: { id: true, name: true, email: true, status: true },
      orderBy: { name: "asc" },
    }),
    prisma.product.findMany({
      where: { vendorId: { not: null } },
      select: {
        id: true,
        name: true,
        vendorId: true,
        variants: {
          select: { id: true, sku: true, stock: true },
          orderBy: { id: "asc" },
        },
      },
      orderBy: { name: "asc" },
    }),
    prisma.driver.findMany({
      select: {
        id: true,
        name: true,
        username: true,
        email: true,
        phone: true,
        vehicleType: true,
        vehicleNumber: true,
        status: true,
        isAvailable: true,
        createdAt: true,
      },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <OrdersTabs
      orders={JSON.parse(JSON.stringify(orders))}
      quotations={JSON.parse(JSON.stringify(quotations))}
      vendors={JSON.parse(JSON.stringify(vendors))}
      products={JSON.parse(JSON.stringify(products))}
      drivers={JSON.parse(JSON.stringify(drivers))}
    />
  );
}
