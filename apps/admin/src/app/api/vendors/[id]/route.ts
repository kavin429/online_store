import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

import { isAdmin } from "@/lib/auth";
import { generateVendorPassword, generateVendorUsername } from "@/lib/vendors";
import { sendVendorActivationEmail } from "@/lib/vendor-email";
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

    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    const username = existing.username ?? (await generateVendorUsername(existing.name));
    const rawPassword = generateVendorPassword();
    const password = await bcrypt.hash(rawPassword, 10);
    await prisma.vendor.update({
      where: { id },
      data: { username, password, plainPassword: rawPassword },
    });
    return NextResponse.json({
      rawPassword,
      credentials: { username, password: rawPassword },
    });
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
    const existing = await prisma.vendor.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    // Reset the generated login password (used by the credentials dialog).
    if (body.resetPassword === true) {
      const username = existing.username ?? (await generateVendorUsername(existing.name));
      const plainPassword = generateVendorPassword();
      const vendor = await prisma.vendor.update({
        where: { id },
        data: {
          username,
          password: await bcrypt.hash(plainPassword, 10),
          plainPassword,
        },
      });

      return NextResponse.json({
        data: vendor,
        credentials: { username, password: plainPassword },
      });
    }

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

    const wasPending = existing.status === "PENDING";
    const activated = status === "ACTIVE" && existing.status !== "ACTIVE";

    // Make sure an activated vendor always has a shareable login.
    const updateData: {
      status: typeof status;
      blockReason: string | null;
      blockedAt: Date | null;
      username?: string;
      password?: string;
      plainPassword?: string;
    } = {
      status,
      blockReason: requiresReason ? reason!.trim() : null,
      blockedAt: status === "BLOCKED" ? new Date() : null,
    };

    let credentials: { username: string; password: string } | undefined;
    if (activated) {
      const username =
        existing.username ?? (await generateVendorUsername(existing.name));
      const plainPassword = existing.plainPassword ?? generateVendorPassword();

      updateData.username = username;
      if (!existing.plainPassword) {
        updateData.password = await bcrypt.hash(plainPassword, 10);
        updateData.plainPassword = plainPassword;
      }

      credentials = { username, password: plainPassword };
    }

    const vendor = await prisma.vendor.update({
      where: { id },
      data: updateData,
    });

    // Pending -> Active is the approval moment: email the login details.
    let emailSent = false;
    if (wasPending && activated && vendor.email && credentials) {
      emailSent = await sendVendorActivationEmail({
        to: vendor.email,
        vendorName: vendor.name,
        username: credentials.username,
        password: credentials.password,
      });
    }

    return NextResponse.json({
      ...vendor,
      ...(credentials ? { credentials } : {}),
      emailSent,
    });
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
