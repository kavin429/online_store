import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const driver = await currentDriver();
  if (!driver) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = Number(params.id);
  if (!Number.isInteger(id) || id <= 0) {
    return NextResponse.json({ error: "Invalid quotation id" }, { status: 400 });
  }

  const body = await req.json().catch(() => ({}));
  if (body.action !== "mark_picked_up") {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const quotation = await prisma.quotation.findUnique({
    where: { id },
    select: { id: true, status: true, driverId: true, vendor: { select: { name: true } } },
  });

  if (!quotation) {
    return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
  }
  if (quotation.driverId !== driver.id) {
    return NextResponse.json({ error: "Not assigned to you" }, { status: 403 });
  }
  if (quotation.status !== "DRIVER_ASSIGNED") {
    return NextResponse.json({ error: "Quotation is not in the correct state" }, { status: 400 });
  }

  await prisma.quotation.update({
    where: { id },
    data: {
      status: "PICKED_UP",
      pickedUpAt: new Date(),
      events: {
        create: {
          status: "PICKED_UP",
          title: "Stock picked up",
          message: `${driver.name} collected the stock from ${quotation.vendor.name}.`,
          actor: "DRIVER",
        },
      },
    },
  });

  return NextResponse.json({ ok: true });
}
