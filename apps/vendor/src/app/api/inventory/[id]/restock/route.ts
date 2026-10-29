import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendExpiryNotice } from "@/lib/expiry-notify";

function getVendorId(req: NextRequest): number | null {
  const raw = req.cookies.get("vendor_session")?.value;
  if (!raw) return null;
  try {
    return JSON.parse(raw).id ?? null;
  } catch {
    return null;
  }
}

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const vendorId = getVendorId(req);
    if (!vendorId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const variantId = Number(params.id);
    if (!Number.isInteger(variantId) || variantId <= 0) {
      return NextResponse.json({ error: "Invalid variant" }, { status: 400 });
    }

    const body = await req.json();
    const quantity = Number(body.quantity);
    const note = typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;
    const batchNumber =
      typeof body.batchNumber === "string" && body.batchNumber.trim()
        ? body.batchNumber.trim()
        : null;

    if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isInteger(quantity)) {
      return NextResponse.json(
        { error: "Quantity must be a positive whole number" },
        { status: 400 }
      );
    }

    let expiresAt: Date | null = null;
    if (body.expiresAt) {
      const raw = String(body.expiresAt);
      const isDateOnly = /^\d{4}-\d{2}-\d{2}$/.test(raw);

      if (isDateOnly) {
        if (raw < todayDateString()) {
          return NextResponse.json(
            { error: "Expiration date cannot be in the past" },
            { status: 400 }
          );
        }
        // Noon UTC keeps the displayed calendar date stable across timezones.
        expiresAt = new Date(`${raw}T12:00:00.000Z`);
      } else {
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Invalid expiration date" }, { status: 400 });
        }
        if (parsed.getTime() < Date.now()) {
          return NextResponse.json(
            { error: "Expiration date cannot be in the past" },
            { status: 400 }
          );
        }
        expiresAt = parsed;
      }
    }

    const variant = await prisma.productVariant.findFirst({
      where: { id: variantId, product: { vendorId } },
      include: {
        product: {
          select: {
            id: true,
            name: true,
            vendor: { select: { email: true, name: true } },
          },
        },
      },
    });

    if (!variant) {
      return NextResponse.json({ error: "Variant not found" }, { status: 404 });
    }

    const { updated, batch } = await prisma.$transaction(async (tx) => {
      const updated = await tx.productVariant.update({
        where: { id: variantId },
        data: { stock: { increment: quantity } },
      });

      const batch = await tx.inventoryBatch.create({
        data: {
          productVariantId: variantId,
          quantity,
          remaining: quantity,
          expiresAt,
          batchNumber,
          note,
        },
      });

      await tx.inventoryLog.create({
        data: {
          productVariantId: variantId,
          change: quantity,
          reason: "RESTOCK",
          note: note || (batchNumber ? `Batch ${batchNumber}` : undefined),
        },
      });

      return { updated, batch };
    });

    // Email only when an expiry date was supplied. A failed email must not
    // fail the restock, so the result is reported instead of thrown.
    let expiryNotice: { sent: boolean; recipients: string[] } | null = null;
    if (expiresAt) {
      expiryNotice = await sendExpiryNotice({
        vendorEmail: variant.product.vendor?.email,
        vendorName: variant.product.vendor?.name,
        productName: variant.product.name,
        sku: variant.sku,
        quantity,
        expiresAt,
        batchNumber,
        note,
      });
    }

    return NextResponse.json({
      data: updated,
      batch,
      expiryNotice,
    });
  } catch (error) {
    console.error("Restock error:", error);
    return NextResponse.json({ error: "Failed to restock" }, { status: 500 });
  }
}
