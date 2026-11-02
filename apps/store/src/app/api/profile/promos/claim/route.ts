import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { normalizePromoCode } from "@/lib/promo";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as { code?: unknown };
    const code = normalizePromoCode(body.code);
    if (!code) {
      return NextResponse.json({ error: "Enter a promo code." }, { status: 400 });
    }

    const promo = await prisma.promo.findUnique({ where: { code } });
    if (!promo) {
      return NextResponse.json({ error: "Invalid promo code." }, { status: 404 });
    }

    if (promo.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This promo code is no longer active." },
        { status: 400 }
      );
    }

    const now = new Date();
    if (promo.startsAt && promo.startsAt > now) {
      return NextResponse.json(
        { error: "This promo code is not active yet." },
        { status: 400 }
      );
    }
    if (promo.expiresAt && promo.expiresAt < now) {
      return NextResponse.json({ error: "This promo code has expired." }, { status: 400 });
    }
    if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
      return NextResponse.json(
        { error: "This promo code has reached its usage limit." },
        { status: 400 }
      );
    }

    const [usageCount, targeted, aggregate] = await Promise.all([
      prisma.promoUsage.count({ where: { promoId: promo.id, userId } }),
      prisma.promoCustomer.findUnique({
        where: { promoId_userId: { promoId: promo.id, userId } },
        select: { id: true },
      }),
      prisma.order.aggregate({
        where: { userId, status: { not: "CANCELLED" } },
        _count: { _all: true },
        _sum: { total: true },
      }),
    ]);

    if (usageCount >= promo.usageLimitPerUser) {
      return NextResponse.json(
        { error: "You have already used this promo code." },
        { status: 400 }
      );
    }

    if (promo.targetType === "ALL" || targeted) {
      return NextResponse.json({
        ok: true,
        already: true,
        message: "This promo is already in your wallet.",
      });
    }

    const orderCount = aggregate._count._all;
    const totalSpent = aggregate._sum.total ?? 0;

    if (promo.targetType === "NEW_CUSTOMER" && orderCount > 0) {
      return NextResponse.json(
        { error: "This promo code is only for first-time orders." },
        { status: 400 }
      );
    }
    if (promo.targetType === "OLD_CUSTOMER" && orderCount < 1) {
      return NextResponse.json(
        { error: "This promo code is only for returning customers." },
        { status: 400 }
      );
    }
    if (promo.targetType === "SELECTED_CUSTOMER") {
      if (promo.minOrderCount != null && orderCount < promo.minOrderCount) {
        return NextResponse.json(
          { error: "This promo code is not available for your account." },
          { status: 400 }
        );
      }
      if (promo.minTotalSpent != null && totalSpent < promo.minTotalSpent) {
        return NextResponse.json(
          { error: "This promo code is not available for your account." },
          { status: 400 }
        );
      }
      if (promo.maxTotalSpent != null && totalSpent > promo.maxTotalSpent) {
        return NextResponse.json(
          { error: "This promo code is not available for your account." },
          { status: 400 }
        );
      }
    }

    await prisma.promoCustomer.upsert({
      where: { promoId_userId: { promoId: promo.id, userId } },
      create: { promoId: promo.id, userId },
      update: {},
    });

    return NextResponse.json({ ok: true, message: "Promo unlocked." });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/promos/claim] failed", error);
    return NextResponse.json(
      { error: "Could not unlock this promo code." },
      { status: 500 }
    );
  }
}
