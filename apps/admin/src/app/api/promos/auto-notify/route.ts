import { NextRequest, NextResponse } from "next/server";
import { getPromoErrorCode, notifyEligiblePromosForUser } from "../targeting";

import { isAdmin } from "@/lib/auth";
// Event-driven promo notification.
// Called by the landing app right after a customer places an order so that any
// promo whose targeting condition just became true is delivered automatically
// (in-app notification + push + email + SMS). Manual notification via
// /api/promos/[id]/notify still works alongside this.
export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const secret = process.env.AUTO_NOTIFY_SECRET;
  if (secret && request.headers.get("x-auto-notify-secret") !== secret) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as Record<string, unknown>;
    const userId = Number(body.userId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return NextResponse.json({ error: "A valid userId is required." }, { status: 400 });
    }

    const result = await notifyEligiblePromosForUser(userId);
    return NextResponse.json(result);
  } catch (error) {
    if (getPromoErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
    console.error("Auto-notify promos error:", error);
    return NextResponse.json({ error: "Failed to auto-notify customer" }, { status: 500 });
  }
}
