import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const customers = await prisma.user.findMany({
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
        status: true,
        blockReason: true,
        blockedAt: true,
        createdAt: true,
      },
    });

    return NextResponse.json(customers);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch customers" }, { status: 500 });
  }
}