import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { triggerPromoAutoNotify } from "@/lib/promoClient";
import { evaluatePromoForUser } from "@/lib/promo";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const {
      fullName,
      email,
      phone,
      address,
      city,
      postalCode,
      paymentMethod,
      items,
      shipping,
      promoCode,
    } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    const parsedItems = items.map((item: any) => ({
      productId: Number(item.id),
      productVariantId: item.variantId ?? null,
      name: String(item.name),
      sellingPrice: Number(item.sellingPrice),
      quantity: Number(item.quantity),
    }));

    // Recompute the subtotal server-side so the discount can't be gamed by the client.
    const subtotal = parsedItems.reduce(
      (sum: number, item: { sellingPrice: number; quantity: number }) =>
        sum + item.sellingPrice * item.quantity,
      0
    );
    const parsedShipping = Number(shipping) || 0;

    // Validate + apply the promo code here (authoritative redemption).
    let discountAmount = 0;
    let appliedPromo: { promoId: number; code: string } | null = null;

    if (promoCode) {
      const result = await evaluatePromoForUser({
        code: promoCode,
        userId: user.id,
        subtotal,
      });

      if (!result.valid) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }

      discountAmount = result.discountAmount;
      appliedPromo = { promoId: result.promo.id, code: result.code };
    }

    const total = Math.max(0, subtotal + parsedShipping - discountAmount);

    // userId comes from the session, never from the client body — prevents spoofing.
    // The order, its promo usage row and the promo's used-count are written together.
    const order = await prisma.$transaction(async (tx) => {
      const created = await tx.order.create({
        data: {
          userId: user.id,
          fullName,
          email,
          phone,
          address,
          city,
          postalCode,
          paymentMethod,
          subtotal,
          shipping: parsedShipping,
          promoCode: appliedPromo?.code ?? null,
          discountAmount,
          total,
          items: { create: parsedItems },
        },
        include: { items: true },
      });

      if (appliedPromo) {
        await tx.promoUsage.create({
          data: {
            promoId: appliedPromo.promoId,
            userId: user.id,
            orderId: created.id,
            discountAmount,
          },
        });
        await tx.promo.update({
          where: { id: appliedPromo.promoId },
          data: { usedCount: { increment: 1 } },
        });
      }

      return created;
    });

    // Event-driven promo notification: re-check targeting now that this order
    // exists so the customer is notified when their condition becomes true.
    await triggerPromoAutoNotify(user.id);

    return NextResponse.json({ success: true, order });
  } catch (error) {
    console.error("CREATE ORDER ERROR:", error);
    return NextResponse.json(
      { error: "Failed to create order" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("FETCH ORDERS ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch orders" },
      { status: 500 }
    );
  }
}