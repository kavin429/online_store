import { NextRequest, NextResponse } from "next/server";
import { serialize } from "cookie";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  try {
    const { name, password } = await req.json();

    if (!name || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const vendor = await prisma.vendor.findFirst({
      where: {
        OR: [
          { email: name },
          { name: name },
        ],
      },
    });

    if (!vendor) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    const passwordMatch = await bcrypt.compare(password, vendor.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 }
      );
    }

    if (vendor.status === "BLOCKED") {
      return NextResponse.json(
        { error: `Your account has been blocked. Reason: ${vendor.blockReason || "Not specified"}` },
        { status: 403 }
      );
    }

    if (vendor.status === "CANCELLED") {
      return NextResponse.json(
        { error: `Your account has been cancelled. Reason: ${vendor.cancelReason || "Not specified"}` },
        { status: 403 }
      );
    }

    if (vendor.status === "PENDING") {
      const createdAt = new Date(vendor.createdAt);
      const now = new Date();
      const hoursElapsed = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

      if (hoursElapsed >= 24) {
        await prisma.vendor.update({
          where: { id: vendor.id },
          data: { status: "ACTIVE" },
        });
      } else {
        const hoursRemaining = Math.ceil(24 - hoursElapsed);
        return NextResponse.json(
          {
            error: `Your verification is pending. Your account will be active within ${hoursRemaining} hour(s). Please check back later.`,
            status: "PENDING",
          },
          { status: 403 }
        );
      }
    }

    const sessionData = JSON.stringify({
      id: vendor.id,
      name: vendor.name,
      email: vendor.email,
    });

    const cookie = serialize("vendor_session", sessionData, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24,
    });

    return NextResponse.json({ message: "Login successful" }, { headers: { "Set-Cookie": cookie } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
