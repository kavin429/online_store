import { NextRequest, NextResponse } from "next/server";
import { prisma, withReconnect } from "@/lib/prisma";
import { OFFER_REQUEST_MAX_BYTES, validateOfferImages } from "@online-store/ui/lib/image";

const offerInclude = {
  promo: { select: { id: true, code: true } },
  products: { include: { product: { select: { id: true, name: true } } } },
} as const;

function parseOfferImages(images: string | null | undefined): string[] {
  if (!images) return [];
  try {
    const parsed = JSON.parse(images);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function serializeOffer<T extends { images?: string | null }>(offer: T) {
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

    // Only allow the vendor to attach their own products.
    const requested: number[] = Array.isArray(b.productIds) ? b.productIds.map(Number) : [];
    const owned = await withReconnect(() =>
      prisma.product.findMany({
        where: { id: { in: requested }, vendorId },
        select: { id: true },
      }),
    );
    const productIds = owned.map((p) => p.id);

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
    }));

    return NextResponse.json(serializeOffer(offer), { status: 201 });
  } catch (err: any) {
    console.error("Create vendor offer error:", err);
    if (err?.code === "P1017" || err?.code === "P1001" || err?.code === "P1002") {
      return NextResponse.json(
        { error: "The database connection was interrupted. Please try again." },
        { status: 503, headers: { "Retry-After": "3" } },
      );
    }
    return NextResponse.json({ error: "Failed to create offer" }, { status: 500 });
  }
}
