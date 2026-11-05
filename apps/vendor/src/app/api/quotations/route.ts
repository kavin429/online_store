import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorIdFromRequest } from "@/lib/session";

export const dynamic = "force-dynamic";

const QUOTATION_INCLUDE = {
  admin: { select: { id: true, name: true } },
  driver: {
    select: {
      id: true,
      name: true,
      phone: true,
      vehicleType: true,
      vehicleNumber: true,
    },
  },
  items: { orderBy: { id: "asc" as const } },
  events: { orderBy: { createdAt: "desc" as const } },
} as const;

export async function GET(req: NextRequest) {
  const vendorId = getVendorIdFromRequest(req);
  if (!vendorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quotations = await prisma.quotation.findMany({
      where: { vendorId },
      include: QUOTATION_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: quotations });
  } catch (error) {
    console.error("[vendor/quotations] GET failed", error);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}
