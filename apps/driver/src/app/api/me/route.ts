import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET() {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const record = await prisma.driver.findUnique({
    where: { id: driver.id },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      vehicleType: true,
      vehicleNumber: true,
      licenseNumber: true,
      status: true,
      isAvailable: true,
      lastLoginAt: true,
      createdAt: true,
    },
  });

  if (!record) {
    return NextResponse.json({ error: "Driver not found" }, { status: 404 });
  }

  return NextResponse.json({ driver: record });
}

export async function PATCH(req: NextRequest) {
  const auth = await currentDriver();
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};

    if (body.isAvailable !== undefined) {
      data.isAvailable = Boolean(body.isAvailable);
    }

    if (typeof body.phone === "string") {
      data.phone = body.phone.trim() || null;
    }

    if (body.currentPassword || body.newPassword) {
      const currentPassword = String(body.currentPassword ?? "");
      const newPassword = String(body.newPassword ?? "");

      if (newPassword.length < 6) {
        return NextResponse.json(
          { error: "The new password must be at least 6 characters" },
          { status: 400 },
        );
      }

      const record = await prisma.driver.findUnique({
        where: { id: auth.id },
        select: { password: true },
      });
      if (!record || !(await bcrypt.compare(currentPassword, record.password))) {
        return NextResponse.json({ error: "Current password is incorrect" }, { status: 400 });
      }

      data.password = await bcrypt.hash(newPassword, 10);
      data.plainPassword = newPassword;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const updated = await prisma.driver.update({
      where: { id: auth.id },
      data,
      select: {
        id: true,
        name: true,
        username: true,
        phone: true,
        isAvailable: true,
      },
    });

    return NextResponse.json({ driver: updated });
  } catch (error) {
    console.error("[driver/me] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}
