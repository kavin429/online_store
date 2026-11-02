import { prisma } from "@/lib/prisma";
import { GEO } from "@/components/profile/constants";
import {
  formatDate,
  formatMonthYear,
  formatShortMonthYear,
  toDateInput,
} from "@/components/profile/helpers";
import type {
  AddressView,
  MembershipView,
  OrderItemView,
  OrderStatus,
  OrderView,
  ProfileData,
  PromoView,
  TierName,
} from "@/components/profile/types";

const PAYMENT_LABELS: Record<string, string> = {
  cod: "Cash on delivery",
  card: "Card payment",
};

const TIER_MULTIPLIER: Record<TierName, number> = {
  Silver: 1,
  Gold: 1.5,
  Platinum: 2,
};

const ROLLING_WINDOW_DAYS = 365;

function resolveTier(spent: number, orders: number): TierName {
  if (spent >= 150_000 || orders >= 25) return "Platinum";
  if (spent >= 50_000 || orders >= 10) return "Gold";
  return "Silver";
}

function mapOrderStatus(
  status: "PENDING" | "CONFIRMED" | "SHIPPED" | "DELIVERED" | "CANCELLED",
  returnStatus?: string | null
): OrderStatus {
  if (returnStatus === "APPROVED" || returnStatus === "REFUNDED") return "Returned";

  switch (status) {
    case "CONFIRMED":
      return "Processing";
    case "SHIPPED":
      return "Shipped";
    case "DELIVERED":
      return "Delivered";
    case "CANCELLED":
      return "Cancelled";
    default:
      return "Pending";
  }
}

function orderRef(id: number) {
  return `ORD-${String(id).padStart(5, "0")}`;
}

function promoValue(promo: {
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  maxDiscount: number | null;
}) {
  if (promo.discountType === "PERCENTAGE") {
    return {
      value: `${Math.round(promo.discountValue * 100) / 100}%`,
      valueSub: promo.maxDiscount ? `UP TO LKR ${promo.maxDiscount.toLocaleString()}` : "OFF",
    };
  }

  return {
    value: `LKR ${promo.discountValue.toLocaleString()}`,
    valueSub: "OFF",
  };
}

function promoTitle(promo: { name: string; description: string | null }) {
  return promo.name.trim() || promo.description?.trim() || "Special offer";
}

function promoDescription(promo: { description: string | null }) {
  return promo.description?.trim() || "Apply this code at checkout to save on your order.";
}

function promoMatchesCustomer(
  promo: {
    targetType: "ALL" | "NEW_CUSTOMER" | "OLD_CUSTOMER" | "SELECTED_CUSTOMER";
    minOrderCount: number | null;
    minTotalSpent: number | null;
    maxTotalSpent: number | null;
  },
  orderCount: number,
  totalSpent: number,
  targeted: boolean
) {
  if (promo.targetType === "ALL") return true;
  if (promo.targetType === "NEW_CUSTOMER") return orderCount === 0;
  if (promo.targetType === "OLD_CUSTOMER") return orderCount >= 1;

  if (targeted) return true;
  if (promo.minOrderCount != null && orderCount < promo.minOrderCount) return false;
  if (promo.minTotalSpent != null && totalSpent < promo.minTotalSpent) return false;
  if (promo.maxTotalSpent != null && totalSpent > promo.maxTotalSpent) return false;
  return true;
}

export async function getProfileData(userId: number): Promise<ProfileData | null> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      addresses: { orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }] },
    },
  });

  if (!user) return null;

  const now = new Date();
  const windowStart = new Date(now.getTime() - ROLLING_WINDOW_DAYS * 24 * 60 * 60 * 1000);

  const [orders, allPromos, usages, countries, aggregate, periodAggregate, pendingOrders] =
    await Promise.all([
      prisma.order.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          items: true,
          returnRequest: true,
          promoUsage: { include: { promo: { select: { code: true } } } },
        },
      }),
      prisma.promo.findMany({
        where: { status: { in: ["ACTIVE", "EXPIRED"] } },
        orderBy: { createdAt: "desc" },
        include: {
          targetCustomers: { where: { userId }, select: { id: true } },
        },
      }),
      prisma.promoUsage.findMany({
        where: { userId },
        orderBy: { createdAt: "desc" },
        include: {
          promo: {
            select: {
              code: true,
              name: true,
              description: true,
              discountType: true,
              discountValue: true,
              maxDiscount: true,
              minOrderAmount: true,
              targetType: true,
              expiresAt: true,
            },
          },
        },
      }),
      prisma.country.findMany({
        where: { status: "ACTIVE" },
        select: { name: true },
        orderBy: { name: "asc" },
      }),
      prisma.order.aggregate({
        where: { userId, status: { not: "CANCELLED" } },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.aggregate({
        where: {
          userId,
          status: { not: "CANCELLED" },
          createdAt: { gte: windowStart },
        },
        _count: { _all: true },
        _sum: { total: true },
      }),
      prisma.order.count({
        where: { userId, status: { in: ["PENDING", "CONFIRMED", "SHIPPED"] } },
      }),
    ]);

  const totalSpent = aggregate._sum.total ?? 0;
  const totalOrders = aggregate._count._all;
  const periodSpent = periodAggregate._sum.total ?? 0;
  const periodOrders = periodAggregate._count._all;
  const tier = resolveTier(periodSpent, periodOrders);
  const multiplier = TIER_MULTIPLIER[tier];
  const points = Math.floor((totalSpent / 100) * multiplier);

  const validThruDate = new Date(user.createdAt);
  validThruDate.setFullYear(validThruDate.getFullYear() + 3);

  const membership: MembershipView = {
    tier,
    points,
    memberNo: `5521${String(user.id).padStart(8, "0")}`,
    since: formatShortMonthYear(user.createdAt),
    validThru: formatShortMonthYear(validThruDate),
    totalSpent,
    totalOrders,
    activeOrders: pendingOrders,
    periodSpent,
    periodOrders,
  };

  // Resolve variant labels for every order line that has a variant.
  const variantIds = Array.from(
    new Set(
      orders
        .flatMap((order) => order.items)
        .map((item) => item.productVariantId)
        .filter((id): id is number => id != null)
    )
  );

  const variants = variantIds.length
    ? await prisma.productVariant.findMany({
        where: { id: { in: variantIds } },
        select: {
          id: true,
          values: {
            select: {
              variantValue: {
                select: { name: true, variantType: { select: { name: true } } },
              },
            },
          },
        },
      })
    : [];

  const variantLabels = new Map<number, string>();
  for (const variant of variants) {
    const label = variant.values
      .map((value) => `${value.variantValue.variantType.name}: ${value.variantValue.name}`)
      .join(" / ");
    variantLabels.set(variant.id, label);
  }

  const orderViews: OrderView[] = orders.map((order) => {
    const status = mapOrderStatus(order.status, order.returnRequest?.status);
    const items: OrderItemView[] = order.items.map((item) => ({
      productId: item.productId,
      productVariantId: item.productVariantId,
      name: item.name,
      variant: item.productVariantId
        ? (variantLabels.get(item.productVariantId) ?? "")
        : "",
      qty: item.quantity,
      price: item.sellingPrice,
    }));

    const returnStatus = order.returnRequest
      ? order.returnRequest.status === "PENDING"
        ? "Pending review"
        : order.returnRequest.status === "APPROVED"
          ? "Approved"
          : order.returnRequest.status === "REFUNDED"
            ? "Refunded"
            : "Rejected"
      : null;

    const eta =
      status === "Cancelled"
        ? `Order cancelled on ${formatDate(order.updatedAt)}`
        : status === "Returned"
          ? `Return processed on ${formatDate(order.returnRequest?.resolvedAt ?? order.updatedAt)}`
          : `Estimated delivery in 3–5 business days`;

    const canCancel =
      (order.status === "PENDING" || order.status === "CONFIRMED") && !order.returnRequest;
    const canReturn = order.status === "DELIVERED" && !order.returnRequest;

    return {
      dbId: order.id,
      id: orderRef(order.id),
      date: formatDate(order.createdAt),
      status,
      items,
      shipping: order.shipping,
      discount: order.discountAmount,
      promo: order.promoUsage?.promo.code ?? order.promoCode ?? undefined,
      payment: PAYMENT_LABELS[order.paymentMethod] ?? order.paymentMethod,
      address: [order.address, order.city, order.postalCode].filter(Boolean).join(", "),
      eta,
      tracking: order.trackingNumber ?? undefined,
      canCancel,
      canReturn,
      returnStatus,
    };
  });

  const usedPromoIds = new Set(usages.map((usage) => usage.promoId));

  const available: PromoView[] = [];
  const expired: PromoView[] = [];

  for (const promo of allPromos) {
    const targeted = promo.targetCustomers.length > 0;
    if (!promoMatchesCustomer(promo, totalOrders, totalSpent, targeted)) continue;

    const usageCount = usages.filter((usage) => usage.promoId === promo.id).length;
    const perUserLimitReached = usageCount >= promo.usageLimitPerUser;
    const globallyUsedUp =
      promo.usageLimit != null && promo.usedCount >= promo.usageLimit;
    const notStarted = !!promo.startsAt && promo.startsAt > now;
    const hasExpired =
      promo.status === "EXPIRED" || (!!promo.expiresAt && promo.expiresAt < now);

    const value = promoValue(promo);

    if (hasExpired) {
      // Do not reveal the code for a secret promo the customer never unlocked.
      if (promo.targetType !== "ALL" && !targeted) continue;
      if (usedPromoIds.has(promo.id)) continue;

      expired.push({
        code: promo.code,
        title: promoTitle(promo),
        description: promoDescription(promo),
        ...value,
        visibility: promo.targetType === "ALL" ? "public" : "email",
        minSpend: promo.minOrderAmount ?? undefined,
        expires: promo.expiresAt ? formatDate(promo.expiresAt) : "Expired",
      });
      continue;
    }

    if (promo.status !== "ACTIVE" || notStarted || globallyUsedUp || perUserLimitReached) {
      continue;
    }

    available.push({
      code: promo.code,
      title: promoTitle(promo),
      description: promoDescription(promo),
      ...value,
      visibility: promo.targetType === "ALL" ? "public" : "email",
      minSpend: promo.minOrderAmount ?? undefined,
      expires: promo.expiresAt ? formatDate(promo.expiresAt) : "No expiry",
      locked: promo.targetType !== "ALL" && !targeted,
    });
  }

  const used: PromoView[] = usages.map((usage) => {
    const value = promoValue(usage.promo);
    return {
      code: usage.promo.code,
      title: promoTitle(usage.promo),
      description: promoDescription(usage.promo),
      ...value,
      visibility: usage.promo.targetType === "ALL" ? "public" : "email",
      minSpend: usage.promo.minOrderAmount ?? undefined,
      expires: usage.promo.expiresAt ? formatDate(usage.promo.expiresAt) : "No expiry",
      usedOn: formatDate(usage.createdAt),
      usedInOrder: orderRef(usage.orderId),
      saved: usage.discountAmount,
    };
  });

  // The legacy single-address columns on User predate the address book. If the
  // customer has never saved an address, import it once so the profile is useful.
  let addressRows = user.addresses;
  if (addressRows.length === 0 && user.address) {
    await prisma.address.create({
      data: {
        userId: user.id,
        label: "Home",
        line: user.address,
        country: user.country || "Sri Lanka",
        province: user.province || "",
        district: user.district || "",
        city: user.city || "",
        postal: "",
        isDefault: true,
      },
    });

    addressRows = await prisma.address.findMany({
      where: { userId: user.id },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });
  }

  const addresses: AddressView[] = addressRows.map((address) => ({
    id: address.id,
    label: address.label,
    line: address.line,
    country: address.country,
    province: address.province,
    district: address.district,
    city: address.city,
    postal: address.postal,
    isDefault: address.isDefault,
  }));

  const countryNames = Array.from(
    new Set([...countries.map((country) => country.name), ...Object.keys(GEO)])
  );

  return {
    user: {
      id: user.id,
      name: user.name?.trim() || "Customer",
      email: user.email ?? "",
      phone: user.phone ?? "",
      dial: user.phoneCode || "+94",
      dob: toDateInput(user.dateOfBirth),
      joined: formatMonthYear(user.createdAt),
      offersEmail: user.offersEmail,
      offersSms: user.offersSms,
    },
    membership,
    orders: orderViews,
    promos: { available, used, expired },
    addresses,
    countries: countryNames,
  };
}
