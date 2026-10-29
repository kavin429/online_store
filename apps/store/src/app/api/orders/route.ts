import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { planFifo } from "@online-store/db";
import { checkStockForLines } from "@/lib/stock";
import { triggerPromoAutoNotify } from "@/lib/promoClient";
import { evaluatePromoForUser } from "@/lib/promo";

/**
 * Deducts sold units from the variant's on-hand batches, oldest expiry first.
 * Stock that predates batch tracking (no batch rows) is still deducted from the
 * variant so totals stay correct.
 */
async function consumeStockFifo(
  tx: any,
  productVariantId: number,
  quantity: number,
) {
  const variant = await tx.productVariant.findUnique({
    where: { id: productVariantId },
    select: { stock: true },
  });
  if (!variant) return;

  const batches = await tx.inventoryBatch.findMany({
    where: { productVariantId, remaining: { gt: 0 } },
  });
  const { allocations, unallocated } = planFifo(batches, quantity);

  for (const allocation of allocations) {
    await tx.inventoryBatch.update({
      where: { id: allocation.batchId },
      data: { remaining: { decrement: allocation.quantity } },
    });
    await tx.inventoryLog.create({
      data: {
        productVariantId,
        change: -allocation.quantity,
        reason: "SALE",
        note: `FIFO batch #${allocation.batchId}`,
      },
    });
  }

  if (unallocated > 0) {
    await tx.inventoryLog.create({
      data: {
        productVariantId,
        change: -unallocated,
        reason: "SALE",
        note: "Stock without a batch record",
      },
    });
  }

  await tx.productVariant.update({
    where: { id: productVariantId },
    data: { stock: Math.max(0, variant.stock - quantity) },
  });
}


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

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
    }

    type ParsedItem = {
      productId: number;
      productVariantId: number | null;
      name: string;
      sellingPrice: number;
      quantity: number;
    };

    const rawItems: any[] = Array.isArray(items) ? items : [];

    const parsedItems: ParsedItem[] = rawItems.map((item) => ({
      productId: Number(item.id),
      productVariantId: item.variantId != null ? Number(item.variantId) : null,
      name: String(item.name),
      sellingPrice: Number(item.sellingPrice),
      quantity: Number(item.quantity),
    }));

    // The cart is product-level, so resolve the variant the shopper picked
    // (selectedVariants: variantTypeId -> variantValueId) before consuming stock.
    const productIds: number[] = Array.from(
      new Set(parsedItems.map((item) => item.productId)),
    );
    const variantsByProduct = new Map<
      number,
      { id: number; values: { variantValueId: number }[] }[]
    >();

    if (productIds.length > 0) {
      const products = await prisma.product.findMany({
        where: { id: { in: productIds } },
        select: {
          id: true,
          variants: { select: { id: true, values: { select: { variantValueId: true } } } },
        },
      });
      for (const product of products) {
        variantsByProduct.set(product.id, product.variants);
      }
    }

    const resolvedItems = parsedItems.map((item, index) => {
      const rawItem = rawItems[index] ?? {};
      const candidates = variantsByProduct.get(item.productId) ?? [];

      let productVariantId = item.productVariantId;
      if (productVariantId && !candidates.some((variant) => variant.id === productVariantId)) {
        productVariantId = null;
      }

      if (!productVariantId) {
        const selected = rawItem?.selectedVariants;
        const selectedIds: number[] =
          selected && typeof selected === "object"
            ? Object.values(selected)
                .map((value) => Number(value))
                .filter((value) => Number.isInteger(value) && value > 0)
            : [];

        if (selectedIds.length > 0) {
          const match = candidates.find((variant) => {
            const valueIds = variant.values.map((value) => value.variantValueId);
            return (
              selectedIds.every((id) => valueIds.includes(id)) &&
              valueIds.every((id) => selectedIds.includes(id))
            );
          });
          if (match) productVariantId = match.id;
        }
      }

      if (!productVariantId && candidates.length === 1) {
        productVariantId = candidates[0].id;
      }

      return { ...item, productVariantId };
    });

    // Never trust the client cart: confirm the requested units are still in
    // stock before an order is written. This also stops orders for products
    // whose stock ran out after the shopper added them to the cart.
    const stockResults = await checkStockForLines(
      resolvedItems.map((item) => ({
        productId: item.productId,
        variantId: item.productVariantId,
      })),
    );

    const insufficientIndex = resolvedItems.findIndex((item, index) => {
      const result = stockResults[index];
      return !result?.found || result.stock < item.quantity;
    });

    if (insufficientIndex !== -1) {
      const result = stockResults[insufficientIndex];
      const name = result?.name ?? resolvedItems[insufficientIndex].name;
      const available = result?.stock ?? 0;

      return NextResponse.json(
        {
          error:
            available > 0
              ? `Only ${available} left in stock for ${name}`
              : `${name} is out of stock`,
        },
        { status: 400 },
      );
    }

    // Recompute the subtotal server-side so the discount can't be gamed by the client.
    const subtotal = resolvedItems.reduce(
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
          items: { create: resolvedItems },
        },
        include: { items: true },
      });

      // FIFO: consume the oldest-expiry batch for every sold variant.
      for (const item of resolvedItems) {
        if (item.productVariantId) {
          await consumeStockFifo(tx, item.productVariantId, item.quantity);
        }
      }

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