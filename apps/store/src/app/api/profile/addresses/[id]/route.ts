import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type AddressPatch = {
  label?: unknown;
  line?: unknown;
  country?: unknown;
  province?: unknown;
  district?: unknown;
  city?: unknown;
  postal?: unknown;
  isDefault?: unknown;
};

const STRING_FIELDS = [
  "label",
  "line",
  "country",
  "province",
  "district",
  "city",
  "postal",
] as const;

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addressId = Number(params.id);
    if (!Number.isInteger(addressId) || addressId <= 0) {
      return NextResponse.json({ error: "Invalid address." }, { status: 400 });
    }

    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    const body = (await req.json().catch(() => ({}))) as AddressPatch;
    const merged = { ...existing };

    for (const field of STRING_FIELDS) {
      if (body[field] !== undefined) {
        merged[field] = String(body[field] ?? "").trim();
      }
    }

    if (!merged.label || !merged.line) {
      return NextResponse.json(
        { error: "Enter a label and street address." },
        { status: 400 }
      );
    }
    if (!merged.country || !merged.province || !merged.district || !merged.city) {
      return NextResponse.json(
        { error: "Please choose country, province, district and city." },
        { status: 400 }
      );
    }

    const makeDefault = body.isDefault === undefined ? existing.isDefault : Boolean(body.isDefault);

    const updated = await prisma.$transaction(async (tx) => {
      if (makeDefault) {
        await tx.address.updateMany({
          where: { userId, NOT: { id: addressId } },
          data: { isDefault: false },
        });
      }

      return tx.address.update({
        where: { id: addressId },
        data: {
          label: merged.label,
          line: merged.line,
          country: merged.country,
          province: merged.province,
          district: merged.district,
          city: merged.city,
          postal: merged.postal,
          isDefault: makeDefault,
        },
      });
    });

    return NextResponse.json({ address: updated });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/addresses/:id] PATCH failed", error);
    return NextResponse.json({ error: "Could not update this address." }, { status: 500 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const addressId = Number(params.id);
    if (!Number.isInteger(addressId) || addressId <= 0) {
      return NextResponse.json({ error: "Invalid address." }, { status: 400 });
    }

    const existing = await prisma.address.findUnique({ where: { id: addressId } });
    if (!existing || existing.userId !== userId) {
      return NextResponse.json({ error: "Address not found." }, { status: 404 });
    }

    await prisma.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const next = await prisma.address.findFirst({
        where: { userId },
        orderBy: { createdAt: "asc" },
      });
      if (next) {
        await prisma.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[profile/addresses/:id] DELETE failed", error);
    return NextResponse.json({ error: "Could not delete this address." }, { status: 500 });
  }
}
