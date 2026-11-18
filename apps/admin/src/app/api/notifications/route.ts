import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

export const dynamic = "force-dynamic";

type NotificationItem = {
  id: string;
  type: "CUSTOMER" | "QUOTATION";
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
};

function parseSince(value: string | null): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

export async function GET(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const since = parseSince(req.nextUrl.searchParams.get("since"));

    const [customers, quotationEvents, customerUnread, quotationUnread] =
      await Promise.all([
        prisma.user.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true,
          },
        }),
        prisma.quotationEvent.findMany({
          where: { actor: "VENDOR" },
          orderBy: { createdAt: "desc" },
          take: 30,
          include: {
            quotation: {
              select: {
                id: true,
                vendor: { select: { id: true, name: true } },
              },
            },
          },
        }),
        since
          ? prisma.user.count({ where: { createdAt: { gt: since } } })
          : Promise.resolve(0),
        since
          ? prisma.quotationEvent.count({
              where: { actor: "VENDOR", createdAt: { gt: since } },
            })
          : Promise.resolve(0),
      ]);

    const items: NotificationItem[] = [
      ...customers.map((customer) => {
        const label =
          customer.name || customer.email || customer.phone || "A new customer";
        return {
          id: `customer-${customer.id}`,
          type: "CUSTOMER" as const,
          title: "New customer registered",
          message: `${label} just signed up.`,
          href: "/dashboard/customers",
          createdAt: customer.createdAt.toISOString(),
          read: since ? customer.createdAt <= since : true,
        };
      }),
      ...quotationEvents.map((event) => {
        const vendorName = event.quotation.vendor?.name ?? "A vendor";
        return {
          id: `quotation-${event.id}`,
          type: "QUOTATION" as const,
          title: event.title,
          message: event.message
            ? `${vendorName}: ${event.message}`
            : `${vendorName} updated a quotation.`,
          href: `/dashboard/quotations?open=${event.quotation.id}`,
          createdAt: event.createdAt.toISOString(),
          read: since ? event.createdAt <= since : true,
        };
      }),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      data: items,
      unreadCount: customerUnread + quotationUnread,
      serverTime: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[admin/notifications] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}
