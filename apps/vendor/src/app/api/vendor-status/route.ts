import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: {
        status: true,
        blockReason: true,
        cancelReason: true,
        createdAt: true,
        isProfileComplete: true,
      },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: vendor.status,
      blockReason: vendor.blockReason,
      cancelReason: vendor.cancelReason,
      createdAt: vendor.createdAt,
      isProfileComplete: vendor.isProfileComplete,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to fetch status" }, { status: 500 });
  }
}
