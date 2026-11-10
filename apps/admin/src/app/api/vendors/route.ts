import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { isAdmin } from "@/lib/auth";
import { generateVendorPassword, generateVendorUsername } from "@/lib/vendors";
import { sendVendorActivationEmail } from "@/lib/vendor-email";

export async function POST(req: Request) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const { password: _password, username: _username, ...rest } = body;

    const name = String(rest.name ?? "").trim();
    if (!name) {
      return NextResponse.json({ error: "Vendor name is required" }, { status: 400 });
    }

    // The admin never types these: generate a login the same way the driver
    // flow does, then show it once so it can be copied and shared.
    const username = await generateVendorUsername(name);
    const plainPassword = generateVendorPassword();
    const password = await bcrypt.hash(plainPassword, 10);

    const vendor = await prisma.vendor.create({
      data: {
        ...rest,
        name,
        username,
        password,
        plainPassword,
      },
    });

    // If the vendor is created as active, email the login details right away.
    let emailSent = false;
    if (vendor.status === "ACTIVE" && vendor.email) {
      emailSent = await sendVendorActivationEmail({
        to: vendor.email,
        vendorName: vendor.name,
        username,
        password: plainPassword,
      });
    }

    return NextResponse.json(
      {
        ...vendor,
        credentials: { username, password: plainPassword },
        emailSent,
      },
      { status: 201 },
    );
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
        username: true,
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