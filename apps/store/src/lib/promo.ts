import { prisma } from "@/lib/prisma";
import type { Promo } from "@online-store/db";

export type PromoEvaluation =
  | {
      valid: true;
      promo: Promo;
      code: string;
      name: string;
      description: string | null;
      discountAmount: number;
    }
  | { valid: false; error: string };

export function normalizePromoCode(code: unknown) {
  return String(code ?? "").trim().toUpperCase();
}

export function computePromoDiscount(promo: Promo, subtotal: number) {
  let discount =
    promo.discountType === "PERCENTAGE"
      ? (subtotal * promo.discountValue) / 100
      : promo.discountValue;

  if (promo.discountType === "PERCENTAGE" && promo.maxDiscount != null) {
    discount = Math.min(discount, promo.maxDiscount);
  }

  // A promo can never discount more than the order itself.
  discount = Math.min(discount, subtotal);

  return Math.max(0, Math.round(discount * 100) / 100);
}

// Server-side evaluation used by both the checkout preview and order placement.
// The discount is always computed here — never trusted from the client.
export async function evaluatePromoForUser({
  code,
  userId,
  subtotal,
}: {
  code: unknown;
  userId: number;
  subtotal: number;
}): Promise<PromoEvaluation> {
  const normalized = normalizePromoCode(code);
  if (!normalized) return { valid: false, error: "Enter a promo code." };

  const promo = await prisma.promo.findUnique({ where: { code: normalized } });
  if (!promo) return { valid: false, error: "Invalid promo code." };
  if (promo.status !== "ACTIVE") {
    return { valid: false, error: "This promo code is no longer active." };
  }

  const now = new Date();
  if (promo.startsAt && promo.startsAt > now) {
    return { valid: false, error: "This promo code is not active yet." };
  }
  if (promo.expiresAt && promo.expiresAt < now) {
    return { valid: false, error: "This promo code has expired." };
  }
  if (promo.usageLimit != null && promo.usedCount >= promo.usageLimit) {
    return { valid: false, error: "This promo code has reached its usage limit." };
  }
  if (promo.minOrderAmount != null && subtotal < promo.minOrderAmount) {
    return {
      valid: false,
      error: `Requires a minimum order of LKR ${promo.minOrderAmount.toLocaleString()}.`,
    };
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
    return { valid: false, error: "You have already used this promo code." };
  }

  const orderCount = aggregate._count._all;
  const totalSpent = aggregate._sum.total ?? 0;

  switch (promo.targetType) {
    case "ALL":
      break;
    case "NEW_CUSTOMER":
      if (orderCount > 0) {
        return { valid: false, error: "This promo code is only for first-time orders." };
      }
      break;
    case "OLD_CUSTOMER":
      if (orderCount < 1) {
        return { valid: false, error: "This promo code is only for returning customers." };
      }
      break;
    case "SELECTED_CUSTOMER":
      // Prefer the explicit targeting list; fall back to the stored criteria.
      if (!targeted) {
        if (promo.minOrderCount != null && orderCount < promo.minOrderCount) {
          return { valid: false, error: "This promo code is not available for your account." };
        }
        if (promo.minTotalSpent != null && totalSpent < promo.minTotalSpent) {
          return { valid: false, error: "This promo code is not available for your account." };
        }
        if (promo.maxTotalSpent != null && totalSpent > promo.maxTotalSpent) {
          return { valid: false, error: "This promo code is not available for your account." };
        }
      }
      break;
  }

  return {
    valid: true,
    promo,
    code: promo.code,
    name: promo.name,
    description: promo.description,
    discountAmount: computePromoDiscount(promo, subtotal),
  };
}
