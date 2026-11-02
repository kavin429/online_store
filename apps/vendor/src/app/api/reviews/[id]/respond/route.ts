import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_COMMENT_LENGTH = 2000;

function getVendorId(req: NextRequest) {
  const vendorSession = req.cookies.get("vendor_session")?.value;
  if (!vendorSession) return null;

  try {
    const session = JSON.parse(vendorSession);
    return typeof session.id === "number" ? session.id : null;
  } catch {
    return null;
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviewId = Number(params.id);
    if (!Number.isInteger(reviewId) || reviewId <= 0) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: {
        id: true,
        status: true,
        product: { select: { vendorId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (review.product.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "You can only reply to reviews of your own products" },
        { status: 403 },
      );
    }
    if (review.status !== "VISIBLE") {
      return NextResponse.json(
        { error: "This review has been hidden by moderation" },
        { status: 403 },
      );
    }

    const body = await req.json();
    const comment = typeof body.comment === "string" ? body.comment.trim() : "";

    if (!comment) {
      return NextResponse.json({ error: "Comment required" }, { status: 400 });
    }
    if (comment.length > MAX_COMMENT_LENGTH) {
      return NextResponse.json(
        { error: `Reply must be ${MAX_COMMENT_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    const existingReply = await prisma.reviewResponse.findFirst({
      where: { reviewId, authorType: "VENDOR" },
      select: { id: true },
    });
    if (existingReply) {
      return NextResponse.json(
        { error: "You have already replied to this review" },
        { status: 409 },
      );
    }

    const response = await prisma.reviewResponse.create({
      data: { comment, reviewId, authorType: "VENDOR", vendorId },
    });

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    console.error("VENDOR REVIEW REPLY ERROR:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
