import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { normalizeEmail } from "@/lib/validators/auth";

/**
 * Legacy credentials endpoint. The store UI signs in through NextAuth, but
 * external clients still call this route, so it follows the same rules:
 * normalised email, a generic failure message, and blocked-account handling.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = normalizeEmail(String(body?.email ?? ""));
    const password = String(body?.password ?? "");

    if (!email || !password) {
      return NextResponse.json(
        { message: "Email and password are required." },
        { status: 400 }
      );
    }

    const user = await prisma.user.findFirst({
      where: { email },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    if (user.status === "BLOCKED") {
      return NextResponse.json(
        { message: "This account has been blocked. Please contact support." },
        { status: 403 }
      );
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      return NextResponse.json(
        { message: "Invalid email or password." },
        { status: 401 }
      );
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("LOGIN ERROR:", error);
    return NextResponse.json(
      { message: "Server error" },
      { status: 500 }
    );
  }
}
