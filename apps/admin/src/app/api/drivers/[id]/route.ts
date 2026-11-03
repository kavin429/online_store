import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { generatePassword } from "@/lib/drivers";

const DRIVER_SELECT = {
  id: true,
  name: true,
  username: true,
  email: true,
  phone: true,
  plainPassword: true,
  vehicleType: true,
  vehicleNumber: true,
  licenseNumber: true,
  note: true,
  status: true,
  isAvailable: true,
  lastLoginAt: true,
  currentLat: true,
  currentLng: true,
  locationUpdatedAt: true,
  createdAt: true,
} as const;

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid driver id" }, { status: 400 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.name !== undefined) {
      const name = String(body.name).trim();
      if (!name) {
        return NextResponse.json({ error: "Driver name is required" }, { status: 400 });
      }
      data.name = name;
    }

    for (const field of [
      "phone",
      "vehicleType",
      "vehicleNumber",
      "licenseNumber",
      "note",
    ] as const) {
      if (body[field] !== undefined) {
        const value = String(body[field] ?? "").trim();
        data[field] = value || null;
      }
    }

    if (body.email !== undefined) {
      const email = String(body.email ?? "").trim().toLowerCase();
      data.email = email || null;
    }

    if (body.status !== undefined) {
      if (!["ACTIVE", "BLOCKED"].includes(body.status)) {
        return NextResponse.json({ error: "Invalid status" }, { status: 400 });
      }
      data.status = body.status;
      // A blocked rider should not receive new work until re-activated.
      if (body.status === "BLOCKED") data.isAvailable = false;
    }

    if (body.isAvailable !== undefined) {
      data.isAvailable = Boolean(body.isAvailable);
    }

    let newPassword: string | undefined;
    if (body.resetPassword === true) {
      newPassword = generatePassword();
      data.password = await bcrypt.hash(newPassword, 10);
      data.plainPassword = newPassword;
    }

    const driver = await prisma.driver.update({
      where: { id },
      data,
      select: DRIVER_SELECT,
    });

    return NextResponse.json({
      data: driver,
      ...(newPassword ? { credentials: { username: driver.username, password: newPassword } } : {}),
    });
  } catch (error: any) {
    console.error("[admin/drivers/[id]] PATCH failed", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    if (error?.code === "P2002") {
      return NextResponse.json({ error: "That email is already in use" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to update driver" }, { status: 500 });
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid driver id" }, { status: 400 });
  }

  try {
    const activeDeliveries = await prisma.order.count({
      where: {
        driverId: id,
        deliveryStatus: {
          in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
        },
      },
    });

    if (activeDeliveries > 0) {
      return NextResponse.json(
        {
          error: `This driver still has ${activeDeliveries} active delivery(ies). Reassign them first.`,
        },
        { status: 409 },
      );
    }

    await prisma.driver.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("[admin/drivers/[id]] DELETE failed", error);
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Driver not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to delete driver" }, { status: 500 });
  }
}
