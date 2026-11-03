import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import {
  DELIVERY_TITLES,
  DRIVER_UPDATABLE_STATUSES,
  orderStatusForDelivery,
  type DeliveryStatus,
} from "@/lib/delivery";

export const dynamic = "force-dynamic";

async function ownedOrder(orderId: number, driverId: number) {
  return prisma.order.findFirst({
    where: { id: orderId, driverId },
    include: { items: true },
  });
}

export async function GET(
  _req: NextRequest,
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
    const order = await prisma.order.findFirst({
      where: { id, driverId: driver.id },
      include: {
        items: true,
        trackingEvents: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[driver/deliveries/[id]] GET failed", error);
    return NextResponse.json({ error: "Failed to load delivery" }, { status: 500 });
  }
}

export async function PATCH(
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
    const deliveryStatus = body.deliveryStatus as DeliveryStatus;

    if (!DRIVER_UPDATABLE_STATUSES.includes(deliveryStatus)) {
      return NextResponse.json(
        { error: "You cannot set this delivery status" },
        { status: 400 },
      );
    }

    const order = await ownedOrder(id, driver.id);
    if (!order) {
      return NextResponse.json({ error: "Delivery not found" }, { status: 404 });
    }

    if (["DELIVERED", "CANCELLED"].includes(order.deliveryStatus)) {
      return NextResponse.json(
        { error: "This delivery is already closed" },
        { status: 400 },
      );
    }

    const note =
      typeof body.note === "string" && body.note.trim()
        ? body.note.trim().slice(0, 500)
        : null;

    const data: Record<string, unknown> = {
      deliveryStatus,
      deliveryNote: note,
    };

    const mapped = orderStatusForDelivery(deliveryStatus);
    if (mapped) data.status = mapped;
    if (deliveryStatus === "PICKED_UP") data.pickedUpAt = new Date();
    if (deliveryStatus === "DELIVERED") data.deliveredAt = new Date();

    const updated = await prisma.$transaction(async (tx) => {
      const result = await tx.order.update({ where: { id }, data });

      await tx.trackingEvent.create({
        data: {
          orderId: id,
          driverId: driver.id,
          status: deliveryStatus,
          title: DELIVERY_TITLES[deliveryStatus],
          message: note,
        },
      });

      if (deliveryStatus === "DELIVERED" || deliveryStatus === "FAILED") {
        // Put the rider back in the available pool for the next job.
        await tx.driver.update({
          where: { id: driver.id },
          data: { isAvailable: true },
        });
      }

      return result;
    });

    return NextResponse.json({ order: updated });
  } catch (error) {
    console.error("[driver/deliveries/[id]] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update delivery" }, { status: 500 });
  }
}
