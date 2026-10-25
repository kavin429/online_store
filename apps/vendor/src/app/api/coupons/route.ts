import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const coupons = await prisma.coupon.findMany({ orderBy: { createdAt: "desc" } });
    return NextResponse.json({ data: coupons });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch coupons" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { code, description, discountType, discountValue, minOrderAmount, usageLimit, expiresAt } = body;

    if (!code || !discountType || discountValue == null) {
      return NextResponse.json({ error: "code, discountType, discountValue required" }, { status: 400 });
    }

    const coupon = await prisma.coupon.create({
      data: {
        code: code.toUpperCase(),
        description,
        discountType,
        discountValue,
        minOrderAmount,
        usageLimit,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      },
    });

    return NextResponse.json({ data: coupon });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create coupon" }, { status: 500 });
  }
}
