import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { isAdmin } from "@/lib/auth";
export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { password: rawPassword, ...rest } = await req.json();
    const password = await bcrypt.hash(rawPassword, 10);
    const vendor = await prisma.vendor.create({ data: { ...rest, password, plainPassword: rawPassword } });
    return NextResponse.json(vendor, { status: 201 });
  } catch (error: any) {
    console.error(error);
    if (error.code === "P2002") {
      return NextResponse.json({ error: "A vendor with this email already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: "Failed to create vendor" }, { status: 500 });
  }
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const vendors = await prisma.vendor.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        image: true,
        email: true,
        phone: true,
        country: true,
        province: true,
        district: true,
        city: true,
        address: true,
        password: true,
        plainPassword: true,
        status: true,
        blockReason: true,
        blockedAt: true,
        createdAt: true,
        vendorSettings: {
          select: {
            id: true,
            storeName: true,
            storeLogo: true,
            storeBanner: true,
            description: true,
            taxId: true,
            businessReg: true,
            bankName: true,
            accountName: true,
            accountNumber: true,
            branch: true,
          },
        },
        _count: {
          select: { products: true, payouts: true, notifications: true },
        },
      },
    });

    const result = vendors.map((v) => {
      const { _count, ...rest } = v;
      return {
        ...rest,
        productsCount: _count.products,
        payoutsCount: _count.payouts,
        notificationsCount: _count.notifications,
      };
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch vendors" }, { status: 500 });
  }
}