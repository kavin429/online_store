import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const variantId = Number(params.id);
    const body = await req.json();
    const { quantity, note } = body;

    if (!quantity || quantity <= 0) {
      return NextResponse.json({ error: "Quantity must be positive" }, { status: 400 });
    }

    const variant = await prisma.productVariant.update({
      where: { id: variantId },
      data: { stock: { increment: quantity } },
    });

    await prisma.inventoryLog.create({
      data: {
        productVariantId: variantId,
        change: quantity,
        reason: "RESTOCK",
        note: note || undefined,
      },
    });

    return NextResponse.json({ data: variant });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to restock" }, { status: 500 });
  }
}
