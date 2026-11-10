import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

// Vendor tier thresholds (LKR GMV from delivered orders).
const GOLD_GMV = 500_000;
const SILVER_GMV = 100_000;

const STATUS_COLORS: Record<string, { dark: string; light: string }> = {
  DELIVERED: { dark: "#e879f9", light: "#c026d3" },
  CONFIRMED: { dark: "#a78bfa", light: "#7c3aed" },
  SHIPPED: { dark: "#34d399", light: "#10b981" },
  PENDING: { dark: "#fbbf24", light: "#f59e0b" },
  CANCELLED: { dark: "#fb7185", light: "#e11d48" },
};

function timeAgo(date: Date): string {
  const minutes = Math.floor((Date.now() - date.getTime()) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

function pctChange(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function tierFor(gmv: number): "Gold" | "Silver" | "Bronze" {
  if (gmv >= GOLD_GMV) return "Gold";
  if (gmv >= SILVER_GMV) return "Silver";
  return "Bronze";
}

// FIFO: earliest expiry first, then the oldest received batch (null expiry last).
function fifoSort(
  a: { expiresAt: Date | null; createdAt: Date },
  b: { expiresAt: Date | null; createdAt: Date }
) {
  const aExpiry = a.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
  const bExpiry = b.expiresAt?.getTime() ?? Number.POSITIVE_INFINITY;
  return aExpiry - bExpiry || a.createdAt.getTime() - b.createdAt.getTime();
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterdayStart = new Date(todayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - 7);
    const prevWeekStart = new Date(now);
    prevWeekStart.setDate(now.getDate() - 14);

    const [
      weekRevenue,
      prevWeekRevenue,
      ordersToday,
      ordersYesterday,
      activeVendors,
      newVendorsThisWeek,
      productsLive,
      newProductsThisWeek,
      orderStatusCounts,
      activeVendorRows,
      productVendorRows,
      deliveredItems,
      offers,
    ] = await Promise.all([
      prisma.order.aggregate({
        where: { status: "DELIVERED", createdAt: { gte: weekStart } },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: { status: "DELIVERED", createdAt: { gte: prevWeekStart, lt: weekStart } },
        _sum: { total: true },
      }),
      prisma.order.count({ where: { createdAt: { gte: todayStart } } }),
      prisma.order.count({ where: { createdAt: { gte: yesterdayStart, lt: todayStart } } }),
      prisma.vendor.count({ where: { status: "ACTIVE" } }),
      prisma.vendor.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.product.count({ where: { status: "ACTIVE" } }),
      prisma.product.count({ where: { createdAt: { gte: weekStart } } }),
      prisma.order.groupBy({
        by: ["status"],
        _count: true,
      }),
      prisma.vendor.findMany({
        where: { status: "ACTIVE" },
        select: { id: true, name: true },
      }),
      prisma.product.findMany({
        select: { id: true, vendorId: true },
      }),
      prisma.orderItem.findMany({
        where: { order: { status: "DELIVERED" } },
        select: { orderId: true, productId: true, quantity: true, sellingPrice: true },
      }),
      prisma.offer.findMany({
        where: { approvalStatus: { in: ["PENDING", "APPROVED"] } },
        orderBy: { createdAt: "asc" },
        take: 8,
        include: { vendor: { select: { name: true } } },
      }),
    ]);

    // Daily revenue for the last 7 days (delivered orders).
    const revenueTrend: { day: string; revenue: number }[] = [];
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
        },
        _sum: { total: true },
      });

      revenueTrend.push({
        day: dayStart.toLocaleDateString("en-US", { weekday: "short" }),
        revenue: Math.round(agg._sum?.total ?? 0),
      });
    }

    // Order status pie (all orders).
    const orderStatus = orderStatusCounts
      .map((s) => {
        const status = String(s.status);
        return {
          name: status.charAt(0) + status.slice(1).toLowerCase(),
          value: s._count,
          dark: STATUS_COLORS[status]?.dark ?? "#64748b",
          light: STATUS_COLORS[status]?.light ?? "#94a3b8",
        };
      })
      .sort((a, b) => b.value - a.value);
    const totalOrders = orderStatus.reduce((sum, s) => sum + s.value, 0);

    // ── Vendor performance (GMV from delivered order items) ──
    // OrderItem has no product relation in the shared schema, so resolve
    // product -> vendor first and aggregate the items in memory.
    const vendorIdByProductId = new Map(productVendorRows.map((p) => [p.id, p.vendorId]));
    const performance = new Map<
      number,
      { id: number; name: string; gmv: number; orderIds: Set<number> }
    >();
    for (const vendor of activeVendorRows) {
      performance.set(vendor.id, { id: vendor.id, name: vendor.name, gmv: 0, orderIds: new Set() });
    }
    for (const item of deliveredItems) {
      const vendorId = vendorIdByProductId.get(item.productId);
      const entry = vendorId != null ? performance.get(vendorId) : undefined;
      if (!entry) continue;
      entry.gmv += item.sellingPrice * item.quantity;
      entry.orderIds.add(item.orderId);
    }
    const topVendors = [...performance.values()].sort((a, b) => b.gmv - a.gmv).slice(0, 5);
    const maxGmv = topVendors[0]?.gmv ?? 0;

    const ratings = await Promise.all(
      topVendors.map((v) =>
        prisma.review.aggregate({
          where: { product: { vendorId: v.id } },
          _avg: { rating: true },
        })
      )
    );

    const vendors = topVendors.map((v, i) => ({
      id: v.id,
      name: v.name,
      gmv: Math.round(v.gmv),
      orders: v.orderIds.size,
      rating: ratings[i]._avg.rating ? Math.round(ratings[i]._avg.rating * 10) / 10 : 0,
      tier: tierFor(v.gmv),
      share: maxGmv > 0 ? Math.round((v.gmv / maxGmv) * 100) : 0,
    }));

    // ── FIFO stock queue for the product with the oldest outstanding batch ──
    const oldestBatch = await prisma.inventoryBatch.findFirst({
      where: { remaining: { gt: 0 } },
      orderBy: { createdAt: "asc" },
      include: { productVariant: { include: { product: { select: { id: true, name: true } } } } },
    });

    let stockQueue: {
      productName: string;
      totalStock: number;
      batches: { id: string; received: string; qty: number; daysAged: number }[];
    } | null = null;

    if (oldestBatch) {
      const featuredProduct = oldestBatch.productVariant.product;
      const variants = await prisma.productVariant.findMany({
        where: { productId: featuredProduct.id },
        select: { id: true },
      });
      const productBatches = await prisma.inventoryBatch.findMany({
        where: {
          productVariantId: { in: variants.map((v) => v.id) },
          remaining: { gt: 0 },
        },
      });
      productBatches.sort(fifoSort);

      stockQueue = {
        productName: featuredProduct.name,
        totalStock: productBatches.reduce((sum, b) => sum + b.remaining, 0),
        batches: productBatches.slice(0, 6).map((b) => ({
          id: b.batchNumber || `B-${b.id}`,
          received: b.createdAt.toLocaleDateString("en-US", { day: "numeric", month: "short" }),
          qty: b.remaining,
          daysAged: Math.max(0, Math.floor((now.getTime() - b.createdAt.getTime()) / 86_400_000)),
        })),
      };
    }

    // ── Offers / collections queue (oldest submission goes live next) ──
    const offersQueue = offers.map((offer, index) => ({
      position: index + 1,
      name: offer.title,
      vendor: offer.vendor?.name ?? "Admin",
      queuedSince: timeAgo(offer.createdAt),
      status:
        offer.approvalStatus === "APPROVED" && offer.status === "ACTIVE"
          ? ("live" as const)
          : ("queued" as const),
    }));

    return NextResponse.json({
      stats: {
        grossRevenue: Math.round(weekRevenue._sum?.total ?? 0),
        revenueDeltaPct: Math.round(pctChange(weekRevenue._sum?.total ?? 0, prevWeekRevenue._sum?.total ?? 0) * 10) / 10,
        ordersToday,
        ordersDeltaPct: Math.round(pctChange(ordersToday, ordersYesterday) * 10) / 10,
        activeVendors,
        newVendorsThisWeek,
        productsLive,
        newProductsThisWeek,
      },
      revenueTrend,
      orderStatus,
      totalOrders,
      vendors,
      stockQueue,
      offersQueue,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch dashboard data" }, { status: 500 });
  }
}
