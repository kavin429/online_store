import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const MAX_REASON_LENGTH = 1000;

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

/** Vendors cannot remove reviews; they report them for an admin to review. */
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
        reportStatus: true,
        product: { select: { vendorId: true } },
      },
    });

    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    if (review.product.vendorId !== vendorId) {
      return NextResponse.json(
        { error: "You can only report reviews of your own products" },
        { status: 403 },
      );
    }
    if (review.reportStatus === "OPEN") {
      return NextResponse.json(
        { error: "This review has already been reported and is awaiting moderation" },
        { status: 409 },
      );
    }

    const body = await req.json();
    const reason = typeof body.reason === "string" ? body.reason.trim() : "";

    if (!reason) {
      return NextResponse.json({ error: "Report reason is required" }, { status: 400 });
    }
    if (reason.length > MAX_REASON_LENGTH) {
      return NextResponse.json(
        { error: `Reason must be ${MAX_REASON_LENGTH} characters or fewer` },
        { status: 400 },
      );
    }

    const updated = await prisma.review.update({
      where: { id: reviewId },
      data: {
        reportStatus: "OPEN",
        reportReason: reason,
        reportedAt: new Date(),
        reportResolvedAt: null,
        reportedByVendorId: vendorId,
      },
      select: {
        id: true,
        reportStatus: true,
        reportReason: true,
        reportedAt: true,
      },
    });

    return NextResponse.json({ data: updated }, { status: 201 });
  } catch (error) {
    console.error("VENDOR REPORT REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to report review" }, { status: 500 });
  }
}
