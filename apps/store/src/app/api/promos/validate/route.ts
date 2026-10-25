import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { evaluatePromoForUser } from "@/lib/promo";

// Lightweight preview endpoint for the checkout page. It validates the code for
// the logged-in customer and returns the discount for the current cart subtotal.
// It does NOT redeem the promo — redemption happens in /api/orders.
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as {
      code?: unknown;
      subtotal?: unknown;
    };

    const subtotal = Number(body.subtotal);
    if (!Number.isFinite(subtotal) || subtotal <= 0) {
      return NextResponse.json({ error: "Invalid cart total." }, { status: 400 });
    }

    const result = await evaluatePromoForUser({
      code: body.code,
      userId: user.id,
      subtotal,
    });

    if (!result.valid) {
      return NextResponse.json({ valid: false, error: result.error });
    }

    return NextResponse.json({
      valid: true,
      code: result.code,
      name: result.name,
      description: result.description,
      discountAmount: result.discountAmount,
    });
  } catch (error) {
    console.error("Validate promo error:", error);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}
