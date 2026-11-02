import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AddressInput = {
  label?: unknown;
  line?: unknown;
  country?: unknown;
  province?: unknown;
  district?: unknown;
  city?: unknown;
  postal?: unknown;
  isDefault?: unknown;
};

function readAddress(body: AddressInput) {
  return {
    label: String(body.label ?? "").trim(),
    line: String(body.line ?? "").trim(),
    country: String(body.country ?? "").trim(),
    province: String(body.province ?? "").trim(),
    district: String(body.district ?? "").trim(),
    city: String(body.city ?? "").trim(),
    postal: String(body.postal ?? "").trim(),
    isDefault: Boolean(body.isDefault),
  };
}

function validateAddress(address: ReturnType<typeof readAddress>) {
  if (!address.label) return "Enter a label for this address.";
  if (!address.line) return "Enter the street address.";
  if (!address.country || !address.province || !address.district || !address.city) {
    return "Please choose country, province, district and city.";
  }
  return null;
}

export async function GET() {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addresses = await prisma.address.findMany({
      where: { userId },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    return NextResponse.json({ addresses });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/addresses] GET failed", error);
    return NextResponse.json({ error: "Could not load your addresses." }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = (await req.json().catch(() => ({}))) as AddressInput;
    const address = readAddress(body);
    const validationError = validateAddress(address);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const existingCount = await prisma.address.count({ where: { userId } });
    const makeDefault = address.isDefault || existingCount === 0;

    const created = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({ where: { userId }, data: { isDefault: false } });
      }

      return tx.address.create({
        data: {
          userId,
          label: address.label,
          line: address.line,
          country: address.country,
          province: address.province,
          district: address.district,
          city: address.city,
          postal: address.postal,
          isDefault: makeDefault,
        },
      });
    });

    return NextResponse.json({ address: created }, { status: 201 });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/addresses] POST failed", error);
    return NextResponse.json({ error: "Could not save this address." }, { status: 500 });
  }
}
