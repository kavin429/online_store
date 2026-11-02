import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

const reviewInclude = {
  user: { select: { id: true, name: true, email: true, image: true } },
  product: { select: { id: true, name: true } },
  reportedByVendor: { select: { id: true, name: true } },
  responses: {
    orderBy: { createdAt: "asc" as const },
    include: {
      user: { select: { id: true, name: true, image: true } },
      vendor: { select: { id: true, name: true } },
      admin: { select: { id: true, name: true } },
    },
  },
} as const;

export async function GET(req: NextRequest) {
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: { product: { vendorId } },
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error("VENDOR FETCH REVIEWS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

/** Vendors can reply and report reviews, but cannot add, edit or delete them. */
export async function POST() {
  return NextResponse.json(
    { error: "Vendors cannot create reviews" },
    { status: 403 },
  );
}
