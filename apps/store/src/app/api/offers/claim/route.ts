import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { prisma } from "@online-store/db";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

/**
 * POST /api/offers/claim  { offerId }  -> claim an offer for the signed-in customer
 * GET  /api/offers/claim                -> list the offers this customer claimed
 */
export async function GET() {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const claims = await prisma.offerClaim.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        offer: {
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
                  },
                },
              },
            },
          },
        },
      },
    });

    return NextResponse.json({
      claims: claims.map((claim) => ({
        id: claim.id,
        claimedAt: claim.createdAt,
        offer: {
          id: claim.offer.id,
          title: claim.offer.title,
          subtitle: claim.offer.subtitle,
          description: claim.offer.description,
          image: claim.offer.image,
          badgeText: claim.offer.badgeText,
          ctaText: claim.offer.ctaText,
          ctaLink: claim.offer.ctaLink,
          endsAt: claim.offer.endsAt,
          promoCode:
            claim.offer.promo?.status === "ACTIVE"
              ? claim.offer.promo.code
              : null,
          products: claim.offer.products
            .filter((p) => p.product.status === "ACTIVE")
            .map((p) => ({
              id: p.product.id,
              name: p.product.name,
              sellingPrice: p.product.sellingPrice,
              discountPercent: p.product.discountPercent,
            })),
        },
      })),
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[offers/claim] GET failed", err);
    return NextResponse.json(
      { error: "Could not load claimed offers" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const offerId = Number(body?.offerId);

    if (!Number.isInteger(offerId) || offerId <= 0) {
      return NextResponse.json(
        { error: "A valid offerId is required" },
        { status: 400 }
      );
    }

    const offer = await prisma.offer.findUnique({
      where: { id: offerId },
      select: {
        id: true,
        title: true,
        status: true,
        startsAt: true,
        endsAt: true,
      },
    });

    if (!offer || offer.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "This offer is not available" },
        { status: 404 }
      );
    }

    const now = new Date();
    if (offer.startsAt && offer.startsAt > now) {
      return NextResponse.json(
        { error: "This offer has not started yet" },
        { status: 400 }
      );
    }
    if (offer.endsAt && offer.endsAt < now) {
      return NextResponse.json(
        { error: "This offer has ended" },
        { status: 400 }
      );
    }

    // The unique (offerId, userId) index makes this idempotent.
    await prisma.offerClaim.upsert({
      where: { offerId_userId: { offerId, userId } },
      create: { offerId, userId },
      update: {},
    });

    return NextResponse.json({
      message: "Offer claimed",
      offerId,
      claimed: true,
    });
  } catch (err) {
    if (err instanceof Response) return err;
    console.error("[offers/claim] POST failed", err);
    return NextResponse.json(
      { error: "Could not claim this offer" },
      { status: 500 }
    );
  }
}
