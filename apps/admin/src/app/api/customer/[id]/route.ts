import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

import { isAdmin } from "@/lib/auth";
export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }

    const body = await req.json();
    const status: "ACTIVE" | "BLOCKED" = body.status;
    const reason: string | undefined = body.reason;

    if (status !== "ACTIVE" && status !== "BLOCKED") {
      return NextResponse.json({ error: "status must be ACTIVE or BLOCKED" }, { status: 400 });
    }
    if (status === "BLOCKED" && !reason?.trim()) {
      return NextResponse.json({ error: "A reason is required to block a customer" }, { status: 400 });
    }

    const customer = await prisma.user.update({
      where: { id },
      data: {
        status,
        blockReason: status === "BLOCKED" ? reason!.trim() : null,
        blockedAt: status === "BLOCKED" ? new Date() : null,
      },
    });

    return NextResponse.json(customer);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update customer status" }, { status: 500 });
  }
}


export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) {
      return NextResponse.json({ error: "Invalid id" }, { status: 400 });
    }
 
    await prisma.user.delete({ where: { id } });
 
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete customer" }, { status: 500 });
  }
}
 