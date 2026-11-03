import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";

export const dynamic = "force-dynamic";

/** The driver app posts its GPS position here while a delivery is open. */
export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid delivery id" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const lat = Number(body.lat);
    const lng = Number(body.lng);

    if (
      !Number.isFinite(lat) ||
      !Number.isFinite(lng) ||
      lat < -90 ||
      lat > 90 ||
      lng < -180 ||
      lng > 180
    ) {
      return NextResponse.json({ error: "Invalid coordinates" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: { id, driverId: driver.id },
      select: { id: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    const now = new Date();

    await prisma.$transaction([
      prisma.order.update({
        where: { id },
        data: {
          currentLat: lat,
          currentLng: lng,
          locationUpdatedAt: now,
        },
      }),
      prisma.driver.update({
        where: { id: driver.id },
        data: {
          currentLat: lat,
          currentLng: lng,
          locationUpdatedAt: now,
        },
      }),
    ]);

    return NextResponse.json({ success: true, lat, lng, updatedAt: now });
  } catch (error) {
    console.error("[driver/deliveries/location] POST failed", error);
    return NextResponse.json({ error: "Failed to save location" }, { status: 500 });
  }
}
