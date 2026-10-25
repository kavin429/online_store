import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { isAdmin } from "@/lib/auth";
export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const rawPassword = Math.random().toString(36).slice(-10);
    const password = await bcrypt.hash(rawPassword, 10);
    await prisma.vendor.update({ where: { id }, data: { password } });
    return NextResponse.json({ rawPassword });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to reset password" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const { password: rawPassword, ...rest } = await req.json();
    const data: any = { ...rest };
    if (rawPassword) {
      data.password = await bcrypt.hash(rawPassword, 10);
      data.plainPassword = rawPassword;
    }

    const vendor = await prisma.vendor.update({ where: { id }, data });
    return NextResponse.json(vendor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update vendor" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    const body = await req.json();
    const status: "PENDING" | "ACTIVE" | "CANCELLED" | "BLOCKED" = body.status;
    const reason: string | undefined = body.reason;

    const allowedStatuses = ["PENDING", "ACTIVE", "CANCELLED", "BLOCKED"];
    if (!allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `status must be one of: ${allowedStatuses.join(", ")}` },
        { status: 400 },
      );
    }

    const requiresReason = status === "BLOCKED" || status === "CANCELLED";
    if (requiresReason && !reason?.trim()) {
      return NextResponse.json(
        { error: `A reason is required to ${status === "BLOCKED" ? "block" : "reject"} a vendor` },
        { status: 400 },
      );
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: {
        status,
        blockReason: requiresReason ? reason!.trim() : null,
        blockedAt: status === "BLOCKED" ? new Date() : null,
      },
    });

    return NextResponse.json(vendor);
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to update vendor status" }, { status: 500 });
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
    if (!id) return NextResponse.json({ error: "Invalid id" }, { status: 400 });

    await prisma.vendor.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to delete vendor" }, { status: 500 });
  }
}
