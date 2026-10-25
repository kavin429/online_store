import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: { product: { vendorId } },
      include: {
        user: { select: { id: true, name: true, email: true, image: true } },
        product: { select: { id: true, name: true } },
        responses: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { rating, comment, productId, userId } = body;

    if (!rating || !productId || !userId) {
      return NextResponse.json({ error: "rating, productId, userId required" }, { status: 400 });
    }

    const review = await prisma.review.create({
      data: { rating, comment, productId, userId },
    });

    return NextResponse.json({ data: review });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to create review" }, { status: 500 });
  }
}
