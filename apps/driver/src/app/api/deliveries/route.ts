import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const scope = req.nextUrl.searchParams.get("scope");

  try {
    const orders = await prisma.order.findMany({
      where: {
        driverId: driver.id,
        ...(scope === "history"
          ? {
              deliveryStatus: {
                in: ["DELIVERED", "FAILED", "CANCELLED"],
              },
            }
          : {
              deliveryStatus: {
                in: ["ASSIGNED", "PICKED_UP", "OUT_FOR_DELIVERY"],
              },
            }),
      },
      include: {
        items: true,
        trackingEvents: { orderBy: { createdAt: "desc" }, take: 5 },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error("[driver/deliveries] GET failed", error);
    return NextResponse.json({ error: "Failed to load deliveries" }, { status: 500 });
  }
}
