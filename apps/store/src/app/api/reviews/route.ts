import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  getCurrentUser,
  reviewInclude,
  reviewSummary,
  serializeReview,
} from "@/lib/reviews";

const MAX_COMMENT_LENGTH = 2000;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = Number(searchParams.get("productId"));

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }

    const [reviews, user] = await Promise.all([
      prisma.review.findMany({
        where: { productId, status: "VISIBLE" },
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
      }),
      getCurrentUser(),
    ]);

    // The customer's own review is returned even when moderation has hidden it,
    // so the page can explain why it is no longer public (and avoid a duplicate
    // review attempt).
    const myReview = user
      ? await prisma.review.findFirst({
          where: { productId, userId: user.id },
          include: reviewInclude,
        })
      : null;

    return NextResponse.json({
      data: reviews.map((review) => serializeReview(review, user?.id ?? null)),
      summary: reviewSummary(reviews),
      myReview: myReview ? serializeReview(myReview, user?.id ?? null) : null,
    });
  } catch (error) {
    console.error("FETCH REVIEWS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const body = await req.json();
    const productId = Number(body.productId);
    const rating = Number(body.rating);
    const comment =
      typeof body.comment === "string" && body.comment.trim()
        ? body.comment.trim()
        : null;

    if (!Number.isInteger(productId) || productId <= 0) {
      return NextResponse.json({ error: "productId is required" }, { status: 400 });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Review must be ${MAX_COMMENT_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      select: { id: true, status: true },
    });
    if (!product || product.status !== "ACTIVE") {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    const existing = await prisma.review.findFirst({
      where: { userId: user.id, productId },
      select: { id: true },
    });
    if (existing) {
      return NextResponse.json(
        { error: "You have already reviewed this product. You can edit your review instead." },
        { status: 409 },
      );
    }

    // Verified purchase is informational; reviews are still open to any customer.
    const deliveredOrder = await prisma.order.findFirst({
      where: {
        userId: user.id,
        status: "DELIVERED",
        items: { some: { productId } },
      },
      select: { id: true },
    });

    const review = await prisma.review.create({
      data: {
        userId: user.id,
        productId,
        rating,
        comment,
        verifiedPurchase: !!deliveredOrder,
      },
      include: reviewInclude,
    });

    return NextResponse.json(
      { data: serializeReview(review, user.id) },
      { status: 201 },
    );
  } catch (error) {
    console.error("CREATE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
