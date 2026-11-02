import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUser, reviewInclude, serializeReview } from "@/lib/reviews";

export async function GET() {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const reviews = await prisma.review.findMany({
      where: { userId: user.id },
      include: reviewInclude,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({
      data: reviews.map((review) => serializeReview(review, user.id)),
    });
  } catch (error) {
    console.error("FETCH MY REVIEWS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
