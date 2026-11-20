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

    const [customers, adminNotifications, customerUnread, adminNotifUnread] =
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
        prisma.adminNotification.findMany({
          orderBy: { createdAt: "desc" },
          take: 30,
        }),
        since
          ? prisma.user.count({ where: { createdAt: { gt: since } } })
          : Promise.resolve(0),
        since
          ? prisma.adminNotification.count({ where: { createdAt: { gt: since } } })
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
      ...adminNotifications.map((n) => ({
        id: `admin-notif-${n.id}`,
        type: "QUOTATION" as const,
        title: n.title,
        message: n.message,
        href: n.href,
        createdAt: n.createdAt.toISOString(),
        read: since ? n.createdAt <= since : true,
      })),
    ].sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );

    return NextResponse.json({
      data: items,
      unreadCount: customerUnread + adminNotifUnread,
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
