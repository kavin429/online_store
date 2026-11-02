import { NextRequest, NextResponse } from "next/server";
import { prisma, withReconnect } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";

type Params = { params: { id: string } };

export async function PATCH(req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewId = Number(params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  try {
    const body = await req.json();
    const existing = await prisma.review.findUnique({
      where: { id: reviewId },
      select: { id: true, reportStatus: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }

    const data: any = {};

    if (body.status !== undefined) {
      if (body.status !== "VISIBLE" && body.status !== "HIDDEN") {
        return NextResponse.json({ error: "Invalid review status" }, { status: 400 });
      }
      data.status = body.status;

      // Hiding a reported review resolves the report as well.
      if (body.status === "HIDDEN" && existing.reportStatus === "OPEN") {
        data.reportStatus = "RESOLVED";
        data.reportResolvedAt = new Date();
      }
    }

    if (body.reportStatus !== undefined) {
      if (!["RESOLVED", "DISMISSED"].includes(body.reportStatus)) {
        return NextResponse.json(
          { error: "Report can only be resolved or dismissed" },
          { status: 400 },
        );
      }
      data.reportStatus = body.reportStatus;
      data.reportResolvedAt = new Date();
    }

    if (body.adminNote !== undefined) {
      data.adminNote =
        typeof body.adminNote === "string" && body.adminNote.trim()
          ? body.adminNote.trim()
          : null;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update" }, { status: 400 });
    }

    const review = await withReconnect(() =>
      prisma.review.update({
        where: { id: reviewId },
        data,
        include: {
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
            orderBy: { createdAt: "asc" },
            include: {
              user: { select: { id: true, name: true, image: true } },
              vendor: { select: { id: true, name: true } },
              admin: { select: { id: true, name: true } },
            },
          },
        },
      }),
    );

    return NextResponse.json({ data: review });
  } catch (error) {
    console.error("ADMIN UPDATE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to update review" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reviewId = Number(params.id);
  if (!Number.isInteger(reviewId) || reviewId <= 0) {
    return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
  }

  try {
    await prisma.review.delete({ where: { id: reviewId } });
    return NextResponse.json({ success: true });
  } catch (error: any) {
    if (error?.code === "P2025") {
      return NextResponse.json({ error: "Review not found" }, { status: 404 });
    }
    console.error("ADMIN DELETE REVIEW ERROR:", error);
    return NextResponse.json({ error: "Failed to delete review" }, { status: 500 });
  }
}
