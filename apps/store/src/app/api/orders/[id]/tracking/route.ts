import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Customer-facing tracking feed for one order. Only the owner may read it.
 * Returns the order items, the assigned driver's public details and the full
 * delivery timeline.
 */
export async function GET(
  _req: Request,
  { params }: { params: { id: string } },
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    // Prefer the session id: customers who signed up with a phone number have
    // no email on their account. Fall back to email for older sessions.
    const sessionUserId = Number(session.user.id);
    const user =
      (Number.isInteger(sessionUserId) && sessionUserId > 0
        ? await prisma.user.findUnique({
            where: { id: sessionUserId },
            select: { id: true },
          })
        : null) ??
      (session.user.email
        ? await prisma.user.findUnique({
            where: { email: session.user.email },
            select: { id: true },
          })
        : null);

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const order = await prisma.order.findFirst({
      where: { id, userId: user.id },
      include: {
        items: true,
        driver: {
          select: {
            id: true,
            name: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            currentLat: true,
            currentLng: true,
            locationUpdatedAt: true,
          },
        },
        trackingEvents: { orderBy: { createdAt: "asc" } },
      },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    console.error("[store/order tracking] GET failed", error);
    return NextResponse.json({ error: "Failed to load tracking" }, { status: 500 });
  }
}
