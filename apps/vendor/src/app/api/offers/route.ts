import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const offerInclude = {
  promo: { select: { id: true, code: true } },
  products: { include: { product: { select: { id: true, name: true } } } },
} as const;

export function parseOfferImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

export function serializeOffer<T extends { images?: string | null }>(offer: T) {
  return { ...offer, images: parseOfferImages(offer.images) };
}

function toImages(value: unknown): string | null {
  if (!Array.isArray(value)) return null;
  const images = value.filter((x): x is string => typeof x === "string" && x.length > 0);
  return images.length ? JSON.stringify(images) : null;
}

function getVendorId(req: NextRequest): number | null {
  const raw = req.cookies.get("vendor_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

export async function GET(req: NextRequest) {
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const offers = await prisma.offer.findMany({
      where: { vendorId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: offerInclude,
    });
    return NextResponse.json(offers.map(serializeOffer));
  } catch (err) {
    console.error("List vendor offers error:", err);
    return NextResponse.json({ error: "Failed to load offers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const b = await req.json();
    if (!b.title || !String(b.title).trim()) {
      return NextResponse.json({ error: "title is required" }, { status: 400 });
    }

    // Only allow the vendor to attach their own products.
    const requested: number[] = Array.isArray(b.productIds) ? b.productIds.map(Number) : [];
    const owned = await prisma.product.findMany({
      where: { id: { in: requested }, vendorId },
      select: { id: true },
    });
    const productIds = owned.map((p) => p.id);

    const offer = await prisma.offer.create({
      data: {
        title: String(b.title).trim(),
        subtitle: b.subtitle || null,
        description: b.description || null,
        image: b.image || null,
        images: toImages(b.images),
        badgeText: b.badgeText || null,
        ctaText: b.ctaText || "Shop Now",
        ctaLink: b.ctaLink || null,
        sortOrder: 0,
        showOnLanding: true,
        startsAt: b.startsAt ? new Date(b.startsAt) : null,
        endsAt: b.endsAt ? new Date(b.endsAt) : null,
        status: "ACTIVE",
        vendorId,
        approvalStatus: "PENDING", // needs admin approval before landing
        products: { create: productIds.map((productId) => ({ productId })) },
      },
      include: offerInclude,
    });

    return NextResponse.json(serializeOffer(offer), { status: 201 });
  } catch (err) {
    console.error("Create vendor offer error:", err);
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
