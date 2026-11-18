import { NextRequest, NextResponse } from "next/server";

import { currentDriver } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const [notifications, unreadCount] = await Promise.all([
      prisma.driverNotification.findMany({
        where: { driverId: driver.id },
        orderBy: { createdAt: "desc" },
        take: 50,
      }),
      prisma.driverNotification.count({
        where: { driverId: driver.id, read: false },
      }),
    ]);

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    console.error("[driver/notifications] GET failed", error);
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 },
    );
  }
}

export async function PATCH(req: NextRequest) {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const ids = Array.isArray(body.ids)
      ? body.ids.map(Number).filter((id: number) => Number.isInteger(id))
      : [];

    if (body.markAllRead) {
      await prisma.driverNotification.updateMany({
        where: { driverId: driver.id, read: false },
        data: { read: true },
      });
    } else if (ids.length > 0) {
      await prisma.driverNotification.updateMany({
        where: { driverId: driver.id, id: { in: ids } },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[driver/notifications] PATCH failed", error);
    return NextResponse.json(
      { error: "Failed to update notifications" },
      { status: 500 },
    );
  }
}
