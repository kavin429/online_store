import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { generatePassword, generateUsername } from "@/lib/drivers";

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
  _count: { select: { deliveries: true } },
} as const;

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const drivers = await prisma.driver.findMany({
      orderBy: { createdAt: "desc" },
      select: DRIVER_SELECT,
    });

    return NextResponse.json({
      data: drivers.map(({ _count, ...driver }) => ({
        ...driver,
        deliveriesCount: _count.deliveries,
      })),
    });
  } catch (error) {
    console.error("[admin/drivers] GET failed", error);
    return NextResponse.json({ error: "Failed to fetch drivers" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const name = String(body.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Driver name is required" }, { status: 400 });
    }

    const phone = body.phone ? String(body.phone).trim() : null;
    const requestedEmail = body.email ? String(body.email).trim().toLowerCase() : "";

    const username = await generateUsername(name);
    const plainPassword = generatePassword();
    const password = await bcrypt.hash(plainPassword, 10);

    if (requestedEmail) {
      const emailTaken = await prisma.driver.findUnique({
        where: { email: requestedEmail },
        select: { id: true },
      });
      if (emailTaken) {
        return NextResponse.json(
          { error: "A driver with this email already exists" },
          { status: 409 },
        );
      }
    }

    const driver = await prisma.driver.create({
      data: {
        name,
        username,
        email: requestedEmail || null,
        phone,
        password,
        plainPassword,
        vehicleType: body.vehicleType ? String(body.vehicleType).trim() : null,
        vehicleNumber: body.vehicleNumber ? String(body.vehicleNumber).trim() : null,
        licenseNumber: body.licenseNumber ? String(body.licenseNumber).trim() : null,
        note: body.note ? String(body.note).trim() : null,
      },
      select: DRIVER_SELECT,
    });

    const { _count, ...rest } = driver;
    return NextResponse.json(
      {
        data: { ...rest, deliveriesCount: _count.deliveries },
        credentials: { username, password: plainPassword },
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error("[admin/drivers] POST failed", error);
    if (error?.code === "P2002") {
      return NextResponse.json(
        { error: "That username or email is already in use" },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Failed to create driver" }, { status: 500 });
  }
}
