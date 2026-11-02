import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isAdmin } from "@/lib/auth";

const MAX_COMMENT_LENGTH = 2000;

type Params = { params: { id: string } };

/** Admins may reply to any review; replies are shown publicly as support. */
export async function POST(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewId = Number(params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  try {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true },
    });
    if (!review) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
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

    const session = await getAdminSession();
    const admin = session?.user?.email
      ? await prisma.admin.findUnique({
          where: { email: session.user.email },
          select: { id: true },
        })
      : null;

    const response = await prisma.reviewResponse.create({
      data: {
        reviewId,
        comment,
        authorType: "ADMIN",
        adminId: admin?.id ?? null,
      },
    });

    return NextResponse.json({ data: response }, { status: 201 });
  } catch (error) {
    console.error("ADMIN REVIEW REPLY ERROR:", error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
