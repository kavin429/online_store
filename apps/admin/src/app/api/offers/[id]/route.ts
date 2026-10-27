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

type Params = { params: { id: string } };

export async function GET(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const offer = await prisma.offer.findUnique({
    where: { id: Number(params.id) },
    include: offerInclude,
  });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  return NextResponse.json(serializeOffer(offer));
}

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  try {
    if (Number(req.headers.get("content-length") ?? 0) > OFFER_REQUEST_MAX_BYTES) {
      return NextResponse.json(
        { error: "The offer is too large. Please use smaller images." },
        { status: 413 },
      );
    }

    const b = await req.json();

    const imagesCheck = validateOfferImages(b.image, b.images);
    if (!imagesCheck.ok) {
      return NextResponse.json({ error: imagesCheck.error }, { status: 413 });
    }

    const images =
      b.images === undefined
        ? undefined
        : Array.isArray(b.images)
          ? b.images.filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
          : [];

    // Basis / sub category: only touched when the request sends one of them
    // (so approve/reject PATCHes that send just approvalStatus are unaffected).
    let basisData: { basis: string | null; subCategoryId: number | null } | undefined;
    if (b.basis !== undefined || b.subCategoryId !== undefined) {
      const existing = await prisma.offer.findUnique({
        where: { id },
        select: { basis: true, subCategoryId: true },
      });
      if (!existing) {
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
      }

      const basisCheck = await resolveBasisFields({
        basis: b.basis !== undefined ? b.basis : existing.basis,
        subCategoryId: b.subCategoryId !== undefined ? b.subCategoryId : existing.subCategoryId,
        productIds: Array.isArray(b.productIds) ? b.productIds.map(Number) : undefined,
      });
      if (!basisCheck.ok) {
        return NextResponse.json({ error: basisCheck.error }, { status: 400 });
      }
      basisData = { basis: basisCheck.basis, subCategoryId: basisCheck.subCategoryId };
    }

    const offer = await withReconnect(() => prisma.$transaction(async (tx) => {
      // Replace the product list wholesale when one is sent.
      if (Array.isArray(b.productIds)) {
        await tx.offerProduct.deleteMany({ where: { offerId: id } });
        await tx.offerProduct.createMany({
          data: b.productIds.map((productId: number) => ({ offerId: id, productId: Number(productId) })),
          skipDuplicates: true,
        });
      }

      return tx.offer.update({
        where: { id },
        data: {
          ...(b.title !== undefined && { title: String(b.title).trim() }),
          ...(b.subtitle !== undefined && { subtitle: b.subtitle || null }),
          ...(b.description !== undefined && { description: b.description || null }),
          ...(b.image !== undefined && { image: b.image || null }),
          ...(images !== undefined && { images: images.length ? JSON.stringify(images) : null }),
          ...(b.badgeText !== undefined && { badgeText: b.badgeText || null }),
          ...(b.ctaText !== undefined && { ctaText: b.ctaText || "Shop Now" }),
          ...(b.ctaLink !== undefined && { ctaLink: b.ctaLink || null }),
          ...(b.promoId !== undefined && { promoId: b.promoId ?? null }),
          ...(basisData && basisData),
          ...(b.sortOrder !== undefined && { sortOrder: Number(b.sortOrder) || 0 }),
          ...(b.showOnLanding !== undefined && { showOnLanding: !!b.showOnLanding }),
          ...(b.startsAt !== undefined && { startsAt: b.startsAt ? new Date(b.startsAt) : null }),
          ...(b.endsAt !== undefined && { endsAt: b.endsAt ? new Date(b.endsAt) : null }),
          ...(b.status !== undefined && { status: b.status }),
          ...(b.approvalStatus !== undefined && { approvalStatus: b.approvalStatus }),
          ...(b.reviewNote !== undefined && { reviewNote: b.reviewNote || null }),
        },
        include: offerInclude,
      });
    }));

    return NextResponse.json(serializeOffer(offer));
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("Update offer error:", err);
    if (err?.code === "P1017" || err?.code === "P1001" || err?.code === "P1002") {
      return NextResponse.json(
        { error: "The database connection was interrupted. Please try again." },
        { status: 503, headers: { "Retry-After": "3" } },
      );
    }
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.offer.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("Delete offer error:", err);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}