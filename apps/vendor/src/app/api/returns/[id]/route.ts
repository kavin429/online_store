import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

const VALID_STATUSES = ["APPROVED", "REJECTED", "REFUNDED"];

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = Number(params.id);
    const body = await req.json();
    const { status, adminNote, refundAmount } = body;

    if (!VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }

    const data: Record<string, unknown> = {
      status,
      adminNote,
    };

    if (status === "REFUNDED") {
      data.refundAmount = refundAmount;
      data.resolvedAt = new Date();
    } else if (status === "APPROVED" || status === "REJECTED") {
      data.resolvedAt = new Date();
    }

    const updated = await prisma.returnRequest.update({
      where: { id },
      data,
      include: {
        order: {
          include: {
            items: true,
            user: { select: { id: true, name: true, email: true } },
          },
        },
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update return" }, { status: 500 });
  }
}
