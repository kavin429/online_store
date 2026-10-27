import { NextRequest, NextResponse } from "next/server";
import { prisma, withReconnect } from "@/lib/prisma";
import { serializeOffer } from "@/lib/offers";
import { resolveBasisFields } from "@/lib/offer-basis";
import { OFFER_REQUEST_MAX_BYTES, validateOfferImages } from "@online-store/ui/lib/image";

import { isAdmin } from "@/lib/auth";
const offerInclude = {
  promo: { select: { id: true, code: true } },
  vendor: { select: { id: true, name: true } },
  subCategory: { select: { id: true, name: true } },
  products: { include: { product: { select: { id: true, name: true } } } },
} as const;

function toImages(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const images = value.filter((x): x is string => typeof x === "string" && x.length > 0);
  return images.length ? JSON.stringify(images) : null;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offers = await withReconnect(() => prisma.offer.findMany({
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: offerInclude,
  }));
  return NextResponse.json(offers.map(serializeOffer));
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    if (Number(req.headers.get("content-length") ?? 0) > OFFER_REQUEST_MAX_BYTES) {
      return NextResponse.json(
        { error: "The offer is too large. Please use smaller images." },
        { status: 413 },
      );
    }

    const b = await req.json();

    if (!b.title || !String(b.title).trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    const imagesCheck = validateOfferImages(b.image, b.images);
    if (!imagesCheck.ok) {
      return NextResponse.json({ error: imagesCheck.error }, { status: 413 });
    }

    const productIds: number[] = Array.isArray(b.productIds) ? b.productIds.map(Number) : [];

    const basisCheck = await resolveBasisFields({
      basis: b.basis,
      subCategoryId: b.subCategoryId,
      productIds,
    });
    if (!basisCheck.ok) {
      return NextResponse.json({ error: basisCheck.error }, { status: 400 });
    }

    const offer = await withReconnect(() => prisma.offer.create({
      data: {
        title: String(b.title).trim(),
        subtitle: b.subtitle || null,
        description: b.description || null,
        image: b.image || null,
        images: toImages(b.images),
        badgeText: b.badgeText || null,
        ctaText: b.ctaText || "Shop Now",
        ctaLink: b.ctaLink || null,
        promoId: b.promoId ?? null,
        basis: basisCheck.basis,
        subCategoryId: basisCheck.subCategoryId,
        sortOrder: Number(b.sortOrder) || 0,
        showOnLanding: b.showOnLanding ?? true,
        startsAt: b.startsAt ? new Date(b.startsAt) : null,
        endsAt: b.endsAt ? new Date(b.endsAt) : null,
        status: b.status || "ACTIVE",
        // Admin-created offers are verified immediately.
        approvalStatus: "APPROVED",
        products: { create: productIds.map((productId) => ({ productId })) },
      },
      include: offerInclude,
    }));

    return NextResponse.json(serializeOffer(offer), { status: 201 });
  } catch (err: any) {
    console.error("Create offer error:", err);
    if (err?.code === "P1017" || err?.code === "P1001" || err?.code === "P1002") {
      return NextResponse.json(
        { error: "The database connection was interrupted. Please try again." },
        { status: 503, headers: { "Retry-After": "3" } },
      );
    }
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}