import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { assignAndNotify, getPromoErrorCode, getTargetUserIds } from "../../targeting";

import { isAdmin } from "@/lib/auth";
type Params = { params: { id: string } };

function parsePromoId(value: string) {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function POST(_request: NextRequest, { params }: Params) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const id = parsePromoId(params.id);

  if (id === null) {
    return NextResponse.json({ error: "Invalid promo ID" }, { status: 400 });
  }

  try {
    const promo = await prisma.promo.findUnique({ where: { id } });

    if (!promo) {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }

    if (promo.targetType === "ALL") {
      return NextResponse.json(
        { error: "All-customer promos do not have a targeted notification list." },
        { status: 400 },
      );
    }

    const userIds = await getTargetUserIds(promo);
    const result = await assignAndNotify(promo.id, userIds);

    return NextResponse.json(result);
  } catch (error) {
    if (getPromoErrorCode(error) === "P2025") {
      return NextResponse.json({ error: "Promo not found" }, { status: 404 });
    }
    console.error("Notify promo error:", error);
    return NextResponse.json({ error: "Failed to notify customers" }, { status: 500 });
  }
}
