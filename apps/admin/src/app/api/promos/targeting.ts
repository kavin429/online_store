import { prisma } from "@/lib/prisma";
import { sendPushToUsers } from "@/lib/push";
import { getStoreLogo, sendMail } from "@/lib/email";
import { buildPromoEmail, PROMO_LOGO_CID } from "@/lib/email-templates";
import { sendSms } from "@/lib/sms";
import type { PromoDiscountType, PromoStatus, PromoTargetType } from "@/lib/types";

type TargetCriteria = {
  targetType: PromoTargetType;
  minOrderCount?: number | null;
  minTotalSpent?: number | null;
  maxTotalSpent?: number | null;
};

export type PromoValues = {
  code: string;
  name: string;
  description: string | null;
  discountType: PromoDiscountType;
  discountValue: number;
  maxDiscount: number | null;
  minOrderAmount: number | null;
  targetType: PromoTargetType;
  minOrderCount: number | null;
  minTotalSpent: number | null;
  maxTotalSpent: number | null;
  usageLimit: number | null;
  usageLimitPerUser: number;
  startsAt: Date | null;
  expiresAt: Date | null;
  status: PromoStatus;
};

export const promoInclude = {
  targetCustomers: {
    include: {
      user: { select: { id: true, name: true, email: true, image: true } },
    },
    orderBy: { createdAt: "asc" as const },
  },
  vendor: { select: { id: true, name: true } },
  admin: { select: { id: true, name: true } },
} as const;

export class PromoInputError extends Error {}

export function getPromoErrorCode(error: unknown) {
  if (typeof error !== "object" || error === null || !("code" in error)) return null;
  return String(error.code);
}

function pick(body: Record<string, unknown>, key: string, fallback: unknown) {
  return Object.prototype.hasOwnProperty.call(body, key) ? body[key] : fallback;
}

function toRequiredString(value: unknown, field: string) {
  const normalized = String(value ?? "").trim();
  if (!normalized) throw new PromoInputError(`${field} is required.`);
  return normalized;
}

function toNullableString(value: unknown, field: string) {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  if (!normalized) return null;
  if (normalized.length > 500) {
    throw new PromoInputError(`${field} must be 500 characters or fewer.`);
  }
  return normalized;
}

function toNumber(
  value: unknown,
  field: string,
  options: { integer?: boolean; min?: number; exclusiveMin?: boolean } = {},
) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    throw new PromoInputError(`${field} must be a valid number.`);
  }
  if (options.integer && !Number.isInteger(number)) {
    throw new PromoInputError(`${field} must be a whole number.`);
  }
  if (options.min !== undefined && number < options.min) {
    throw new PromoInputError(`${field} must be at least ${options.min}.`);
  }
  if (options.exclusiveMin && options.min !== undefined && number <= options.min) {
    throw new PromoInputError(`${field} must be greater than ${options.min}.`);
  }
  return number;
}

function toNullableNumber(
  value: unknown,
  field: string,
  options: { integer?: boolean; min?: number; exclusiveMin?: boolean } = {},
) {
  if (value === null || value === undefined || value === "") return null;
  return toNumber(value, field, options);
}

function toDate(value: unknown, field: string) {
  if (value === null || value === undefined || value === "") return null;
  const date = value instanceof Date ? new Date(value) : new Date(String(value));
  if (Number.isNaN(date.getTime())) {
    throw new PromoInputError(`${field} must be a valid date.`);
  }
  return date;
}

function toDiscountType(value: unknown): PromoDiscountType {
  if (value === "PERCENTAGE" || value === "FIXED") return value;
  throw new PromoInputError("discountType must be PERCENTAGE or FIXED.");
}

function toTargetType(value: unknown): PromoTargetType {
  if (
    value === "ALL" ||
    value === "NEW_CUSTOMER" ||
    value === "OLD_CUSTOMER" ||
    value === "SELECTED_CUSTOMER"
  ) {
    return value;
  }
  throw new PromoInputError("targetType is invalid.");
}

function toStatus(value: unknown): PromoStatus {
  if (value === "ACTIVE" || value === "INACTIVE" || value === "EXPIRED") return value;
  throw new PromoInputError("status is invalid.");
}

export function getOptionalPromoOwnerId(value: unknown, field: string) {
  return toNullableNumber(value, field, { integer: true, min: 1 });
}

export function parsePromoValues(body: Record<string, unknown>, current?: PromoValues): PromoValues {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    throw new PromoInputError("Request body must be a JSON object.");
  }

  const code = toRequiredString(pick(body, "code", current?.code), "Code").toUpperCase();
  const name = toRequiredString(pick(body, "name", current?.name), "Name");
  const discountType = toDiscountType(
    pick(body, "discountType", current?.discountType ?? "FIXED"),
  );
  const targetType = toTargetType(pick(body, "targetType", current?.targetType ?? "ALL"));
  const maxDiscount = toNullableNumber(
    pick(body, "maxDiscount", current?.maxDiscount),
    "Max discount",
    { min: 0, exclusiveMin: true },
  );
  const values: PromoValues = {
    code,
    name,
    description: toNullableString(pick(body, "description", current?.description), "Description"),
    discountType,
    discountValue: toNumber(
      pick(body, "discountValue", current?.discountValue),
      "Discount value",
      { min: 0, exclusiveMin: true },
    ),
    maxDiscount: discountType === "PERCENTAGE" ? maxDiscount : null,
    minOrderAmount: toNullableNumber(
      pick(body, "minOrderAmount", current?.minOrderAmount),
      "Minimum order amount",
      { min: 0 },
    ),
    targetType,
    minOrderCount: toNullableNumber(
      pick(body, "minOrderCount", current?.minOrderCount),
      "Minimum order count",
      { integer: true, min: 0 },
    ),
    minTotalSpent: toNullableNumber(
      pick(body, "minTotalSpent", current?.minTotalSpent),
      "Minimum total spent",
      { min: 0 },
    ),
    maxTotalSpent: toNullableNumber(
      pick(body, "maxTotalSpent", current?.maxTotalSpent),
      "Maximum total spent",
      { min: 0 },
    ),
    usageLimit: toNullableNumber(
      pick(body, "usageLimit", current?.usageLimit),
      "Usage limit",
      { integer: true, min: 1 },
    ),
    usageLimitPerUser: toNumber(
      pick(body, "usageLimitPerUser", current?.usageLimitPerUser ?? 1),
      "Usage limit per customer",
      { integer: true, min: 1 },
    ),
    startsAt: toDate(pick(body, "startsAt", current?.startsAt), "Start date"),
    expiresAt: toDate(pick(body, "expiresAt", current?.expiresAt), "Expiry date"),
    status: toStatus(pick(body, "status", current?.status ?? "ACTIVE")),
  };

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    throw new PromoInputError("Code must be 3-32 characters using letters, numbers, _ or -.");
  }
  if (name.length > 120) {
    throw new PromoInputError("Name must be 120 characters or fewer.");
  }
  if (discountType === "PERCENTAGE" && values.discountValue > 100) {
    throw new PromoInputError("Percentage discount cannot be greater than 100.");
  }
  if (
    targetType === "SELECTED_CUSTOMER" &&
    values.minOrderCount == null &&
    values.minTotalSpent == null &&
    values.maxTotalSpent == null
  ) {
    throw new PromoInputError("Selected customer promos require at least one targeting criterion.");
  }
  if (
    values.minTotalSpent != null &&
    values.maxTotalSpent != null &&
    values.minTotalSpent > values.maxTotalSpent
  ) {
    throw new PromoInputError("Minimum total spent cannot be greater than maximum total spent.");
  }
  if (
    values.startsAt &&
    values.expiresAt &&
    values.expiresAt.getTime() <= values.startsAt.getTime()
  ) {
    throw new PromoInputError("Expiry date must be after the start date.");
  }

  return values;
}

export async function getTargetUserIds(criteria: TargetCriteria): Promise<number[]> {
  const { targetType, minOrderCount, minTotalSpent, maxTotalSpent } = criteria;

  if (targetType === "ALL") return [];

  if (targetType === "NEW_CUSTOMER") {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", orders: { none: {} } },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  if (targetType === "OLD_CUSTOMER") {
    const users = await prisma.user.findMany({
      where: { status: "ACTIVE", orders: { some: {} } },
      select: { id: true },
    });
    return users.map((user) => user.id);
  }

  const [activeUsers, aggregates] = await Promise.all([
    prisma.user.findMany({ where: { status: "ACTIVE" }, select: { id: true } }),
    prisma.order.groupBy({
      by: ["userId"],
      _sum: { total: true },
      _count: { _all: true },
    }),
  ]);

  const aggregatesByUser = new Map(aggregates.map((aggregate) => [aggregate.userId, aggregate]));
  const matchedUserIds: number[] = [];

  for (const user of activeUsers) {
    const aggregate = aggregatesByUser.get(user.id);
    const orderCount = aggregate?._count._all ?? 0;
    const totalSpent = aggregate?._sum.total ?? 0;

    if (minOrderCount != null && orderCount < minOrderCount) continue;
    if (minTotalSpent != null && totalSpent < minTotalSpent) continue;
    if (maxTotalSpent != null && totalSpent > maxTotalSpent) continue;

    matchedUserIds.push(user.id);
  }

  return matchedUserIds;
}

function getNotificationContent(promo: {
  code: string;
  name: string;
  discountType: PromoDiscountType;
  discountValue: number;
  expiresAt: Date | null;
}) {
  const discount =
    promo.discountType === "PERCENTAGE"
      ? `${promo.discountValue}% off`
      : `Rs. ${promo.discountValue} off`;
  const expiry = promo.expiresAt ? ` before ${promo.expiresAt.toISOString().slice(0, 10)}` : "";
  return {
    title: promo.name ? `New promo: ${promo.name}` : "New promo code for you",
    message: `Use code ${promo.code} — ${discount}${expiry}.`,
  };
}

export async function assignAndNotify(promoId: number, userIds: number[]) {
  const promo = await prisma.promo.findUnique({ where: { id: promoId } });

  if (!promo) throw new Error("Promo not found");

  const targetUserIds = [...new Set(userIds)];

  if (targetUserIds.length === 0) {
    await prisma.promoCustomer.deleteMany({ where: { promoId } });
    return { targeted: 0, notified: 0 };
  }

  const notifiedUserIds = await prisma.$transaction(async (transaction) => {
    await transaction.promoCustomer.deleteMany({
      where: { promoId, userId: { notIn: targetUserIds } },
    });

    const existingTargets = await transaction.promoCustomer.findMany({
      where: { promoId, userId: { in: targetUserIds } },
      select: { userId: true },
    });
    const existingUserIds = new Set(existingTargets.map((target) => target.userId));
    const newUserIds = targetUserIds.filter((userId) => !existingUserIds.has(userId));

    if (newUserIds.length === 0) return [];

    const notifiedAt = new Date();
    const { title, message } = getNotificationContent(promo);

    await transaction.promoCustomer.createMany({
      data: newUserIds.map((userId) => ({
        promoId,
        userId,
        notified: true,
        notifiedAt,
      })),
      skipDuplicates: true,
    });

    await transaction.customerNotification.createMany({
      data: newUserIds.map((userId) => ({
        userId,
        type: "PROMO_CODE",
        title,
        message,
        promoId,
      })),
    });

    return newUserIds;
  });

  if (notifiedUserIds.length > 0) {
    const { title, message } = getNotificationContent(promo);

    await sendPushToUsers(notifiedUserIds, { title, body: message, url: "/" });

    const recipients = await prisma.user.findMany({
      where: { id: { in: notifiedUserIds } },
      select: { id: true, name: true, email: true, phone: true },
    });

    const logo = getStoreLogo();
    const attachments = logo
      ? [{ filename: "logo.png", content: logo, cid: PROMO_LOGO_CID }]
      : undefined;
    const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

    await Promise.all(
      recipients.map(async (user) => {
        if (user.email) {
          const { subject, text, html } = buildPromoEmail({
            recipientName: user.name,
            storeUrl,
            promo,
          });
          await sendMail({ to: user.email, subject, text, html, attachments });
        }

        if (user.phone) {
          await sendSms({ to: user.phone, body: `${title}\n${message}` });
        }
      }),
    );
  }

  return { targeted: targetUserIds.length, notified: notifiedUserIds.length };
}

// Additive, single-customer notification used by the event-driven flow.
// Unlike assignAndNotify it never removes other targeted customers.
export async function notifyPromoForUser(promoId: number, userId: number) {
  const promo = await prisma.promo.findUnique({ where: { id: promoId } });
  if (!promo) return { notified: false };

  const existing = await prisma.promoCustomer.findUnique({
    where: { promoId_userId: { promoId, userId } },
  });
  if (existing?.notified) return { notified: false };

  const notifiedAt = new Date();
  const { title, message } = getNotificationContent(promo);

  await prisma.$transaction(async (transaction) => {
    await transaction.promoCustomer.upsert({
      where: { promoId_userId: { promoId, userId } },
      update: { notified: true, notifiedAt },
      create: { promoId, userId, notified: true, notifiedAt },
    });

    await transaction.customerNotification.create({
      data: { userId, type: "PROMO_CODE", title, message, promoId },
    });
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, phone: true },
  });

  if (user) {
    await sendPushToUsers([user.id], { title, body: message, url: "/" });

    const logo = getStoreLogo();
    const attachments = logo
      ? [{ filename: "logo.png", content: logo, cid: PROMO_LOGO_CID }]
      : undefined;
    const storeUrl = process.env.NEXT_PUBLIC_STORE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";

    if (user.email) {
      const { subject, text, html } = buildPromoEmail({
        recipientName: user.name,
        storeUrl,
        promo,
      });
      await sendMail({ to: user.email, subject, text, html, attachments });
    }

    if (user.phone) {
      await sendSms({ to: user.phone, body: `${title}\n${message}` });
    }
  }

  return { notified: true };
}

// Returns every active promo whose targeting condition is currently satisfied
// by the given customer (evaluated against their latest order history).
export async function getEligiblePromoIdsForUser(userId: number): Promise<number[]> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { status: true },
  });
  if (!user || user.status !== "ACTIVE") return [];

  const [aggregate, promos] = await Promise.all([
    prisma.order.aggregate({
      where: { userId, status: { not: "CANCELLED" } },
      _sum: { total: true },
      _count: { _all: true },
    }),
    prisma.promo.findMany({
      where: {
        status: "ACTIVE",
        targetType: { not: "ALL" },
        OR: [{ startsAt: null }, { startsAt: { lte: new Date() } }],
      },
      select: {
        id: true,
        targetType: true,
        minOrderCount: true,
        minTotalSpent: true,
        maxTotalSpent: true,
        expiresAt: true,
      },
    }),
  ]);

  const orderCount = aggregate._count._all;
  const totalSpent = aggregate._sum.total ?? 0;
  const now = Date.now();
  const eligible: number[] = [];

  for (const promo of promos) {
    if (promo.expiresAt && promo.expiresAt.getTime() < now) continue;

    if (promo.targetType === "NEW_CUSTOMER") {
      if (orderCount <= 1) eligible.push(promo.id);
      continue;
    }

    if (promo.targetType === "OLD_CUSTOMER") {
      if (orderCount >= 1) eligible.push(promo.id);
      continue;
    }

    // SELECTED_CUSTOMER
    if (promo.minOrderCount != null && orderCount < promo.minOrderCount) continue;
    if (promo.minTotalSpent != null && totalSpent < promo.minTotalSpent) continue;
    if (promo.maxTotalSpent != null && totalSpent > promo.maxTotalSpent) continue;
    eligible.push(promo.id);
  }

  return eligible;
}

// Event-driven entry point: called after a customer places an order.
export async function notifyEligiblePromosForUser(userId: number) {
  const promoIds = await getEligiblePromoIdsForUser(userId);

  const notified: number[] = [];
  for (const promoId of promoIds) {
    const result = await notifyPromoForUser(promoId, userId);
    if (result.notified) notified.push(promoId);
  }

  return { evaluated: promoIds.length, notified };
}
