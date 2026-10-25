import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const offerInclude = {
  promo: { select: { id: true, code: true } },
  products: { include: { product: { select: { id: true, name: true } } } },
} as const;

type Params = { params: { id: string } };

function getVendorId(req: NextRequest): number | null {
  const raw = req.cookies.get("vendor_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

function serializeOffer<T extends { images?: string | null }>(offer: T) {
  let images: string[] = [];
  if (offer.images) {
    try {
      const parsed = JSON.parse(offer.images);
      images = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      images = [];
    }
  }
  return { ...offer, images };
}

export async function GET(req: NextRequest, { params }: Params) {
  const vendorId = getVendorId(req);
  if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const offer = await prisma.offer.findFirst({
    where: { id: Number(params.id), vendorId },
    include: offerInclude,
  });
  if (!offer) return NextResponse.json({ error: "Offer not found" }, { status: 404 });
  return NextResponse.json(serializeOffer(offer));
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const id = Number(params.id);
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.offer.findFirst({ where: { id, vendorId } });
    if (!existing) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    const b = await req.json();

    const images =
      b.images === undefined
        ? undefined
        : Array.isArray(b.images)
          ? b.images.filter((x: unknown): x is string => typeof x === "string" && x.length > 0)
          : [];

    const offer = await prisma.$transaction(async (tx) => {
      if (Array.isArray(b.productIds)) {
        const requested = b.productIds.map(Number);
        const owned = await tx.product.findMany({
          where: { id: { in: requested }, vendorId },
          select: { id: true },
        });
        await tx.offerProduct.deleteMany({ where: { offerId: id } });
        await tx.offerProduct.createMany({
          data: owned.map((p) => ({ offerId: id, productId: p.id })),
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
          ...(b.startsAt !== undefined && { startsAt: b.startsAt ? new Date(b.startsAt) : null }),
          ...(b.endsAt !== undefined && { endsAt: b.endsAt ? new Date(b.endsAt) : null }),
          // Any edit sends the offer back for admin review.
          approvalStatus: "PENDING",
          reviewNote: null,
        },
        include: offerInclude,
      });
    });

    return NextResponse.json(serializeOffer(offer));
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("Update vendor offer error:", err);
    return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const existing = await prisma.offer.findFirst({ where: { id: Number(params.id), vendorId } });
    if (!existing) return NextResponse.json({ error: "Offer not found" }, { status: 404 });

    await prisma.offer.delete({ where: { id: Number(params.id) } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    if (err?.code === "P2025") {
      return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }
    console.error("Delete vendor offer error:", err);
    return NextResponse.json({ error: "Failed to delete offer" }, { status: 500 });
  }
}
