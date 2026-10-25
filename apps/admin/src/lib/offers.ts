// src/lib/offers.ts — server-only helper used by the landing site
import { prisma } from "@/lib/prisma";

/** Parse the JSON gallery column stored on Offer.images. */
export function parseOfferImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

/** Serialize an offer (or list of offers) for the admin API responses. */
export function serializeOffer<T extends { images?: string | null }>(offer: T) {
  return { ...offer, images: parseOfferImages(offer.images) };
}

export type LandingOffer = {
  id: number;
  title: string;
  subtitle: string | null;
  description: string | null;
  image: string | null;
  badgeText: string | null;
  ctaText: string;
  ctaLink: string | null;
  promoCode: string | null;
  endsAt: string | null;
  products: {
    id: number;
    name: string;
    sellingPrice: number | null;
    discountPercent: number | null;
    image: string | null;
  }[];
};

/** Offers that are ACTIVE and inside their date window. */
export async function getActiveOffers(opts: { landingOnly?: boolean; limit?: number } = {}) {
  const now = new Date();

  const offers = await prisma.offer.findMany({
    where: {
      status: "ACTIVE",
      ...(opts.landingOnly ? { showOnLanding: true } : {}),
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    take: opts.limit,
    include: {
      promo: { select: { code: true, status: true } },
      products: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sellingPrice: true,
              discountPercent: true,
              status: true,
              images: { take: 1, select: { data: true } },
            },
          },
        },
      },
    },
  });

  const result: LandingOffer[] = offers.map((o) => ({
    id: o.id,
    title: o.title,
    subtitle: o.subtitle,
    description: o.description,
    image: o.image,
    badgeText: o.badgeText,
    ctaText: o.ctaText,
    ctaLink: o.ctaLink,
    // never advertise a code that is switched off
    promoCode: o.promo && o.promo.status === "ACTIVE" ? o.promo.code : null,
    endsAt: o.endsAt ? o.endsAt.toISOString() : null,
    products: o.products
      .filter((op) => op.product.status === "ACTIVE")
      .map((op) => ({
        id: op.product.id,
        name: op.product.name,
        sellingPrice: op.product.sellingPrice,
        discountPercent: op.product.discountPercent,
        image: op.product.images[0]
          ? `data:image/jpeg;base64,${Buffer.from(op.product.images[0].data).toString("base64")}`
          : null,
      })),
  }));

  return result;
}