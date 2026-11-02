import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  canModifyReview,
  getCurrentUser,
  REVIEW_EDIT_WINDOW_DAYS,
  reviewInclude,
  serializeReview,
} from "@/lib/reviews";

const MAX_COMMENT_LENGTH = 2000;

type Params = { params: { id: string } };

const ruleMessage =
  `Reviews can only be changed within ${REVIEW_EDIT_WINDOW_DAYS} days of posting ` +
  "and before the store or an admin replies. Contact support if you need help.";

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const reviewId = Number(params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { responses: { select: { authorType: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "You can only edit your own review" }, { status: 403 });
    }
    if (!canModifyReview(existing, user.id)) {
      return NextResponse.json({ error: ruleMessage }, { status: 403 });
    }

    const body = await req.json();
    const rating = body.rating === undefined ? existing.rating : Number(body.rating);
    const comment =
      body.comment === undefined
        ? existing.comment
        : typeof body.comment === "string" && body.comment.trim()
          ? body.comment.trim()
          : null;

    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Rating must be between 1 and 5" }, { status: 400 });
    }
    if (comment && comment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Review must be ${MAX_COMMENT_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    const review = await prisma.review.update({
      where: { id: reviewId },
      data: { rating, comment, editedAt: new Date() },
      include: reviewInclude,
    });

    return NextResponse.json({ data: serializeReview(review, user.id) });
  } catch (error) {
    console.error("UPDATE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const reviewId = Number(params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      include: { responses: { select: { authorType: true } } },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (existing.userId !== user.id) {
      return NextResponse.json({ error: "You can only delete your own review" }, { status: 403 });
    }
    if (!canModifyReview(existing, user.id)) {
      return NextResponse.json({ error: ruleMessage }, { status: 403 });
    }

    await prisma.review.delete({ where: { id: reviewId } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
