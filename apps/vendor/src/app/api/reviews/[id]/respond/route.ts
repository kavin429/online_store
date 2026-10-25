import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const reviewId = Number(params.id);
    if (!reviewId) {
      return NextResponse.json({ error: "Invalid review id" }, { status: 400 });
    }

    const body = await req.json();
    const { comment } = body;

    if (!comment) {
      return NextResponse.json({ error: "Comment required" }, { status: 400 });
    }

    const response = await prisma.reviewResponse.create({
      data: { comment, reviewId },
    });

    return NextResponse.json({ data: response });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to respond" }, { status: 500 });
  }
}
