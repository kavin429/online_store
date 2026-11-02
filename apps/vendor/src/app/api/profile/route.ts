import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function vendorIdFrom(req: NextRequest) {
  const raw = req.cookies.get("vendor_session")?.value;
  if (!raw) return null;

  try {
    const session = JSON.parse(raw) as { id?: unknown };
    const id = Number(session.id);
    return Number.isInteger(id) && id > 0 ? id : null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const vendorId = vendorIdFrom(req);
    if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        province: true,
        district: true,
        city: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });

    if (!vendor) return NextResponse.json({ error: "Vendor not found." }, { status: 404 });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("[vendor/profile] GET failed", error);
    return NextResponse.json({ error: "Could not load your profile." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const vendorId = vendorIdFrom(req);
    if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const name = String(body.name ?? "").trim();
    const phone = String(body.phone ?? "").trim();

    if (!name) {
      return NextResponse.json({ error: "Please enter your name." }, { status: 400 });
    }
    if (!/^[0-9+\-\s()]{6,20}$/.test(phone)) {
      return NextResponse.json({ error: "Enter a valid phone number." }, { status: 400 });
    }

    const text = (key: string) => {
      const value = body[key];
      if (value === undefined || value === null) return null;
      const trimmed = String(value).trim();
      return trimmed || null;
    };

    const vendor = await prisma.vendor.update({
      where: { id: vendorId },
      data: {
        name,
        phone,
        country: text("country"),
        province: text("province"),
        district: text("district"),
        city: text("city"),
        address: text("address"),
      },
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        country: true,
        province: true,
        district: true,
        city: true,
        address: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ vendor });
  } catch (error) {
    console.error("[vendor/profile] PATCH failed", error);
    return NextResponse.json({ error: "Could not save your profile." }, { status: 500 });
  }
}
