import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
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

    const body = (await req.json().catch(() => ({}))) as { reason?: unknown };
    const reason = String(body.reason ?? "").trim();
    if (!reason) {
      return NextResponse.json(
        { error: "Please tell us why you want to return this order." },
        { status: 400 }
      );
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { returnRequest: true },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }
    if (order.status !== "DELIVERED") {
      return NextResponse.json(
        { error: "Only delivered orders can be returned." },
        { status: 400 }
      );
    }
    if (order.returnRequest) {
      return NextResponse.json(
        { error: "A return request already exists for this order." },
        { status: 400 }
      );
    }

    const request = await prisma.returnRequest.create({
      data: {
        orderId: order.id,
        reason: reason.slice(0, 1000),
      },
    });

    return NextResponse.json({ ok: true, returnRequest: request }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[orders/:id/return] failed", error);
    return NextResponse.json(
      { error: "Could not create the return request." },
      { status: 500 }
    );
  }
}
