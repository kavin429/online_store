import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();

    const data: Record<string, unknown> = {};
    if (body.code !== undefined) data.code = body.code.toUpperCase();
    if (body.description !== undefined) data.description = body.description;
    if (body.discountType !== undefined) data.discountType = body.discountType;
    if (body.discountValue !== undefined) data.discountValue = body.discountValue;
    if (body.minOrderAmount !== undefined) data.minOrderAmount = body.minOrderAmount;
    if (body.usageLimit !== undefined) data.usageLimit = body.usageLimit;
    if (body.active !== undefined) data.active = body.active;
    if (body.expiresAt !== undefined) data.expiresAt = body.expiresAt ? new Date(body.expiresAt) : null;

    const updated = await prisma.coupon.update({ where: { id }, data });
    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update coupon" }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    await prisma.coupon.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete coupon" }, { status: 500 });
  }
}
