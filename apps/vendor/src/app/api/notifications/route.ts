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

    const notifications = await prisma.notification.findMany({
      where: { vendorId },
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    const unreadCount = await prisma.notification.count({
      where: { vendorId, read: false },
    });

    return NextResponse.json({ data: notifications, unreadCount });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
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

    const body = await req.json();
    const { ids, markAllRead } = body;

    if (markAllRead) {
      await prisma.notification.updateMany({
        where: { vendorId, read: false },
        data: { read: true },
      });
    } else if (ids?.length) {
      await prisma.notification.updateMany({
        where: { id: { in: ids }, vendorId },
        data: { read: true },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update notifications" }, { status: 500 });
  }
}
