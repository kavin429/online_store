import { NextRequest, NextResponse } from "next/server";
import { prisma, withReconnect } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

const reviewInclude = {
  user: { select: { id: true, name: true, email: true, image: true } },
  product: {
    select: {
      id: true,
      name: true,
      vendor: { select: { id: true, name: true } },
    },
  },
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

export async function GET(_req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const reviews = await withReconnect(() =>
      prisma.review.findMany({
        include: reviewInclude,
        orderBy: { createdAt: "desc" },
      }),
    );

    return NextResponse.json({ data: reviews });
  } catch (error) {
    console.error("ADMIN FETCH REVIEWS ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch reviews" }, { status: 500 });
  }
}
