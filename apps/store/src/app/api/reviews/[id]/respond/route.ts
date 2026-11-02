import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, reviewInclude, serializeReview } from "@/lib/reviews";

const MAX_COMMENT_LENGTH = 2000;

type Params = { params: { id: string } };

/** A customer may post one follow-up reply on their own review. */
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const reviewId = Number(params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, userId: true, status: true },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (review.userId !== user.id) {
      return NextResponse.json({ error: "You can only reply to your own review" }, { status: 403 });
    }
    if (review.status !== "VISIBLE") {
      return NextResponse.json({ error: "This review is no longer visible" }, { status: 403 });
    }

    const body = await req.json();
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";
    if (!comment) {
      return NextResponse.json({ error: "Comment is required" }, { status: 400 });
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Reply must be ${MAX_COMMENT_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    const existingReply = await prisma.reviewResponse.findFirst({
      where: { reviewId, authorType: "CUSTOMER" },
      select: { id: true },
    });
    if (existingReply) {
      return NextResponse.json({ error: "You have already replied to this review" }, { status: 409 });
    }

    await prisma.reviewResponse.create({
      data: { reviewId, comment, authorType: "CUSTOMER", userId: user.id },
    });

    const updated = await prisma.review.findUnique({
      where: { id: reviewId },
      include: reviewInclude,
    });

    return NextResponse.json(
      { data: updated ? serializeReview(updated, user.id) : null },
      { status: 201 },
    );
  } catch (error) {
    console.error("CUSTOMER REVIEW REPLY ERROR:", error);
    return NextResponse.json({ error: "Failed to post reply" }, { status: 500 });
  }
}
