import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { emailSchema, normalizeEmail } from "@/lib/validators/auth";

/**
 * Used by the signup form to tell the customer, before they submit, whether an
 * email address is already registered.
 */
export async function GET(req: NextRequest) {
  const raw = req.nextUrl.searchParams.get("email") ?? "";
  const email = normalizeEmail(raw);

  const valid = emailSchema.safeParse(email);
  if (!valid.success) {
    return NextResponse.json(
      { available: false, error: valid.error.issues[0]?.message ?? "Invalid email" },
      { status: 400 }
    );
  }

  try {
    const existing = await prisma.user.findFirst({
      where: { email },
      select: { id: true },
    });

    return NextResponse.json({
      available: !existing,
      exists: Boolean(existing),
      message: existing ? "This email is already registered." : "Email is available.",
    });
  } catch (error) {
    console.error("CHECK EMAIL ERROR:", error);
    return NextResponse.json(
      { available: false, error: "Could not check this email right now." },
      { status: 500 }
    );
  }
}
