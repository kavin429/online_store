import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orderId = Number(params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, promoUsage: true, returnRequest: true },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.returnRequest) {
      return NextResponse.json(
        { error: "This order already has a return request." },
        { status: 400 }
      );
    }
    if (order.status !== "PENDING" && order.status !== "CONFIRMED") {
      return NextResponse.json(
        { error: "This order can no longer be cancelled." },
        { status: 400 }
      );
    }

    await prisma.$transaction(async (tx) => {
      for (const item of order.items) {
        if (!item.productVariantId) continue;

        await tx.productVariant.update({
          where: { id: item.productVariantId },
          data: { stock: { increment: item.quantity } },
        });
        await tx.inventoryLog.create({
          data: {
            productVariantId: item.productVariantId,
            change: item.quantity,
            reason: "CANCELLED",
            note: `Order ORD-${String(order.id).padStart(5, "0")} cancelled`,
          },
        });
      }

      if (order.promoUsage) {
        await tx.promo.update({
          where: { id: order.promoUsage.promoId },
          data: { usedCount: { decrement: 1 } },
        });
      }

      await tx.order.update({
        where: { id: order.id },
        data: { status: "CANCELLED" },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[orders/:id/cancel] failed", error);
    return NextResponse.json({ error: "Could not cancel this order." }, { status: 500 });
  }
}
