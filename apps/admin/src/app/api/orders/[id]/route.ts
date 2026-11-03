import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const VALID_STATUSES = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED"];

const DELIVERY_STATUSES = [
  "UNASSIGNED",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
] as const;

type DeliveryStatus = (typeof DELIVERY_STATUSES)[number];

const DELIVERY_TITLES: Record<DeliveryStatus, string> = {
  UNASSIGNED: "Awaiting a driver",
  ASSIGNED: "Driver assigned",
  PICKED_UP: "Order picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Order delivered",
  FAILED: "Delivery attempt failed",
  CANCELLED: "Delivery cancelled",
};

function orderStatusForDelivery(status: DeliveryStatus) {
  switch (status) {
    case "PICKED_UP":
    case "OUT_FOR_DELIVERY":
      return "SHIPPED" as const;
    case "DELIVERED":
      return "DELIVERED" as const;
    case "CANCELLED":
      return "CANCELLED" as const;
    default:
      return null;
  }
}

// Update order status / driver assignment / delivery progress
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.status !== undefined) {
      if (!VALID_STATUSES.includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
    }

    let event: { title: string; message?: string; status: DeliveryStatus } | null = null;

    if (body.driverId !== undefined) {
      const driverId =
        body.driverId === null || body.driverId === "" ? null : Number(body.driverId);

      if (driverId !== null && (!Number.isInteger(driverId) || driverId <= 0)) {
        return NextResponse.json({ error: "Invalid driver id" }, { status: 400 });
      }

      if (driverId === null) {
        data.driverId = null;
        data.deliveryStatus = "UNASSIGNED";
        data.assignedAt = null;
        data.pickedUpAt = null;
        data.deliveredAt = null;
        event = {
          title: "Driver unassigned",
          status: "UNASSIGNED",
          message: "A driver will be assigned again shortly.",
        };
      } else {
        const driver = await prisma.driver.findUnique({
          where: { id: driverId },
          select: { id: true, name: true, status: true, vehicleNumber: true },
        });

        if (!driver) {
          return NextResponse.json({ error: "Driver not found" }, { status: 404 });
        }
        if (driver.status === "BLOCKED") {
          return NextResponse.json(
            { error: "This driver is blocked and cannot take deliveries" },
            { status: 400 },
          );
        }

        data.driverId = driverId;
        data.deliveryStatus = "ASSIGNED";
        data.assignedAt = new Date();
        data.pickedUpAt = null;
        data.deliveredAt = null;
        event = {
          title: "Driver assigned",
          status: "ASSIGNED",
          message: `${driver.name} will deliver your order${
            driver.vehicleNumber ? ` (${driver.vehicleNumber})` : ""
          }.`,
        };
      }
    }

    if (body.deliveryStatus !== undefined) {
      const deliveryStatus = body.deliveryStatus as DeliveryStatus;
      if (!DELIVERY_STATUSES.includes(deliveryStatus)) {
        return NextResponse.json({ error: "Invalid delivery status" }, { status: 400 });
      }

      data.deliveryStatus = deliveryStatus;
      const mapped = orderStatusForDelivery(deliveryStatus);
      if (mapped) data.status = mapped;

      if (deliveryStatus === "PICKED_UP") data.pickedUpAt = new Date();
      if (deliveryStatus === "DELIVERED") data.deliveredAt = new Date();

      event = {
        title: DELIVERY_TITLES[deliveryStatus],
        status: deliveryStatus,
        message: typeof body.deliveryNote === "string" ? body.deliveryNote.trim() : undefined,
      };
    }

    if (body.deliveryNote !== undefined) {
      data.deliveryNote = String(body.deliveryNote ?? "").trim() || null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.$transaction(async (tx) => {
      const order = await tx.order.update({ where: { id }, data });

      if (event) {
        await tx.trackingEvent.create({
          data: {
            orderId: id,
            driverId: (data.driverId as number | null | undefined) ?? order.driverId,
            status: event.status,
            title: event.title,
            message: event.message ?? null,
          },
        });
      }

      return order;
    });

    return NextResponse.json({ data: updated });
  } catch (error: any) {
    console.error(error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const message = error instanceof Error ? error.message : "Failed to update order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// Delete an order
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    await prisma.order.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    const message = error instanceof Error ? error.message : "Failed to delete order";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
