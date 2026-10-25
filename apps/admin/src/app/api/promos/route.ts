import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assignAndNotify,
  getOptionalPromoOwnerId,
  getPromoErrorCode,
  getTargetUserIds,
  parsePromoValues,
  promoInclude,
  PromoInputError,
} from "./targeting";

import { isAdmin } from "@/lib/auth";
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const promos = await prisma.promo.findMany({
      orderBy: { createdAt: "desc" },
      include: promoInclude,
    });
    return NextResponse.json(promos);
  } catch (error) {
    console.error("Get promos error:", error);
    return NextResponse.json({ error: "Failed to get promos" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const values = parsePromoValues(body);
    const vendorId = getOptionalPromoOwnerId(body.vendorId, "Vendor ID");
    const adminId = getOptionalPromoOwnerId(body.adminId, "Admin ID");

    const promo = await prisma.promo.create({
      data: {
        ...values,
        vendorId,
        adminId,
      },
    });

    const userIds = await getTargetUserIds(promo);
    await assignAndNotify(promo.id, userIds);

    const createdPromo = await prisma.promo.findUnique({
      where: { id: promo.id },
      include: promoInclude,
    });

    return NextResponse.json(createdPromo, { status: 201 });
  } catch (error) {
    if (error instanceof PromoInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (getPromoErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "That promo code is already in use." }, { status: 409 });
    }
    console.error("Create promo error:", error);
    return NextResponse.json({ error: "Failed to create promo" }, { status: 500 });
  }
}
