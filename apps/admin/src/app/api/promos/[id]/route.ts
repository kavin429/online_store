import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  assignAndNotify,
  getPromoErrorCode,
  getTargetUserIds,
  parsePromoValues,
  promoInclude,
  PromoInputError,
  type PromoValues,
} from "../targeting";

import { isAdmin } from "@/lib/auth";
type Params = { params: { id: string } };

function parsePromoId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parsePromoId(params.id);

  if (id === null) {
    return NextResponse.json({ error: "Invalid promo ID" }, { status: 400 });
  }

  try {
    const promo = await prisma.promo.findUnique({
      where: { id },
      include: promoInclude,
    });

    if (!promo) {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }

    return NextResponse.json(promo);
  } catch (error) {
    console.error("Get promo error:", error);
    return NextResponse.json({ error: "Failed to get promo" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parsePromoId(params.id);

  if (id === null) {
    return NextResponse.json({ error: "Invalid promo ID" }, { status: 400 });
  }

  try {
    const currentPromo = await prisma.promo.findUnique({ where: { id } });

    if (!currentPromo) {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }

    const body = (await request.json()) as Record<string, unknown>;
    const currentValues: PromoValues = currentPromo;
    const values = parsePromoValues(body, currentValues);

    if (values.usageLimit !== null && values.usageLimit < currentPromo.usedCount) {
      throw new PromoInputError("Usage limit cannot be lower than the number of redemptions.");
    }

    const updatedPromo = await prisma.promo.update({
      where: { id },
      data: values,
    });

    const targetingChanged = [
      "targetType",
      "minOrderCount",
      "minTotalSpent",
      "maxTotalSpent",
    ].some((field) => Object.prototype.hasOwnProperty.call(body, field));

    if (targetingChanged) {
      const userIds = await getTargetUserIds(updatedPromo);
      await assignAndNotify(updatedPromo.id, userIds);
    }

    const promo = await prisma.promo.findUnique({
      where: { id },
      include: promoInclude,
    });

    return NextResponse.json(promo);
  } catch (error) {
    if (error instanceof PromoInputError) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    if (getPromoErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }
    if (getPromoErrorCode(error) === "P2002") {
      return NextResponse.json({ error: "That promo code is already in use." }, { status: 409 });
    }
    console.error("Update promo error:", error);
    return NextResponse.json({ error: "Failed to update promo" }, { status: 500 });
  }
}

export async function DELETE(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parsePromoId(params.id);

  if (id === null) {
    return NextResponse.json({ error: "Invalid promo ID" }, { status: 400 });
  }

  try {
    await prisma.promo.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    if (getPromoErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }
    console.error("Delete promo error:", error);
    return NextResponse.json({ error: "Failed to delete promo" }, { status: 500 });
  }
}
