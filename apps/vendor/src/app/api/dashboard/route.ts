import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);

    // OrderItem has no product relation in the shared schema, so resolve the
    // vendor's product ids first and filter order items by those.
    const vendorProducts = await prisma.product.findMany({
      where: { vendorId },
      select: { id: true },
    });
    const itemFilter = { productId: { in: vendorProducts.map((p) => p.id) } };

    const [
      totalProducts,
      activeProducts,
      lowStockProducts,
      pendingOrders,
      todayOrders,
      todayRevenue,
      weekRevenue,
      recentOrders,
      recentReviews,
      orderStatusCounts,
      weeklyRevenueTrend,
      bestSellingProducts,
      unreadNotifications,
    ] = await Promise.all([
      prisma.product.count({ where: { vendorId } }),
      prisma.product.count({ where: { vendorId, status: "ACTIVE" } }),
      prisma.product.count({ where: { vendorId, stock: { lt: 10 }, status: "ACTIVE" } }),
      prisma.order.count({
        where: {
          status: "PENDING",
          items: { some: itemFilter },
        },
      }),
      prisma.order.count({
        where: {
          createdAt: { gte: todayStart },
          items: { some: itemFilter },
        },
      }),
      prisma.order.aggregate({
        where: {
          status: "DELIVERED",
          createdAt: { gte: todayStart },
          items: { some: itemFilter },
        },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          status: "DELIVERED",
          createdAt: { gte: weekStart },
          items: { some: itemFilter },
        },
        _sum: { total: true },
      }),
      prisma.order.findMany({
        where: { items: { some: itemFilter } },
        include: {
          user: { select: { name: true } },
          items: true,
        },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.review.findMany({
        where: { product: { vendorId } },
        include: { user: { select: { name: true } }, product: { select: { name: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      }),
      prisma.order.groupBy({
        by: ["status"],
        where: {
          createdAt: { gte: weekStart },
          items: { some: itemFilter },
        },
        _count: true,
      }),
      (async () => {
        const days: { date: string; revenue: number }[] = [];
        for (let i = 6; i >= 0; i--) {
          const dayStart = new Date(now);
          dayStart.setDate(now.getDate() - i);
          dayStart.setHours(0, 0, 0, 0);
          const dayEnd = new Date(dayStart);
          dayEnd.setHours(23, 59, 59, 999);

          const agg = await prisma.order.aggregate({
            where: {
              status: "DELIVERED",
              createdAt: { gte: dayStart, lte: dayEnd },
              items: { some: itemFilter },
            },
            _sum: { total: true },
          });

          const dayName = dayStart.toLocaleDateString("en-US", { weekday: "short" });
          days.push({ date: dayName, revenue: agg._sum?.total ?? 0 });
        }
        return days;
      })(),
      prisma.orderItem.groupBy({
        by: ["productId"],
        where: { productId: { in: vendorProducts.map((p) => p.id) } },
        _sum: { quantity: true },
        _count: true,
        orderBy: { _sum: { quantity: "desc" } },
        take: 5,
      }),
      prisma.notification.count({
        where: { vendorId, read: false },
      }),
    ]);

    const productIds = bestSellingProducts.map((p) => p.productId);
    const productNames = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, name: true },
    });
    const nameMap = new Map(productNames.map((p) => [p.id, p.name]));

    return NextResponse.json({
      stats: {
        totalProducts,
        activeProducts,
        lowStockProducts,
        pendingOrders,
        todayOrders,
        todayRevenue: todayRevenue._sum?.total ?? 0,
        weekRevenue: weekRevenue._sum?.total ?? 0,
        unreadNotifications,
      },
      recentOrders: recentOrders.map((o) => ({
        id: o.id,
        customer: o.fullName,
        total: o.total,
        status: o.status,
        date: o.createdAt,
        itemCount: o.items.length,
      })),
      recentReviews: recentReviews.map((r) => ({
        id: r.id,
        rating: r.rating,
        comment: r.comment,
        customer: r.user.name,
        product: r.product.name,
        date: r.createdAt,
      })),
      orderStatusCounts: orderStatusCounts.map((s) => ({
        status: s.status,
        count: s._count,
      })),
      weeklyRevenueTrend: weeklyRevenueTrend,
      bestSellingProducts: bestSellingProducts.map((p) => ({
        name: nameMap.get(p.productId) || "Unknown",
        totalSold: p._sum?.quantity ?? 0,
        orderCount: p._count,
      })),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
