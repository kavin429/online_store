import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    let vendorId: number | null = null;
    const vendorSession = req.cookies.get("vendor_session")?.value;
    if (vendorSession) {
      try {
        const session = JSON.parse(vendorSession);
        vendorId = session.id;
      } catch {}
    }

    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payouts = await prisma.payout.findMany({
      where: { vendorId },
      include: { items: { include: { order: true } } },
      orderBy: { createdAt: "desc" },
    });

    const totalEarned = payouts
      .filter((p) => p.status === "PAID")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = payouts
      .filter((p) => p.status === "PENDING")
      .reduce((sum, p) => sum + p.amount, 0);

    return NextResponse.json({ data: payouts, summary: { totalEarned, pendingAmount } });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch payouts" }, { status: 500 });
  }
}
