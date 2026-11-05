import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession, isAdmin } from "@/lib/auth";
import { quotationRef, sendQuotationEmail } from "@/lib/quotation-email";

export const dynamic = "force-dynamic";

const QUOTATION_INCLUDE = {
  vendor: { select: { id: true, name: true, email: true, phone: true } },
  admin: { select: { id: true, name: true, email: true } },
  driver: {
    select: {
      id: true,
      name: true,
      username: true,
      phone: true,
      vehicleType: true,
      vehicleNumber: true,
      status: true,
    },
  },
  items: { orderBy: { id: "asc" as const } },
  events: { orderBy: { createdAt: "desc" as const } },
} as const;

type IncomingItem = {
  productId?: unknown;
  productVariantId?: unknown;
  quantity?: unknown;
  requestedUnitPrice?: unknown;
};

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function toPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const quotations = await prisma.quotation.findMany({
      include: QUOTATION_INCLUDE,
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: quotations });
  } catch (error) {
    console.error("[admin/quotations] GET failed", error);
    return NextResponse.json({ error: "Failed to fetch quotations" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));

    const vendorId = toPositiveInt(body.vendorId);
    if (!vendorId) {
      return NextResponse.json({ error: "Please choose a vendor" }, { status: 400 });
    }

    const requestNote =
      typeof body.requestNote === "string" && body.requestNote.trim()
        ? body.requestNote.trim()
        : null;

    const rawItems: IncomingItem[] = Array.isArray(body.items) ? body.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json(
        { error: "Add at least one product to the request" },
        { status: 400 },
      );
    }

    const vendor = await prisma.vendor.findUnique({
      where: { id: vendorId },
      select: { id: true, name: true, email: true, status: true },
    });

    if (!vendor) {
      return NextResponse.json({ error: "Vendor not found" }, { status: 404 });
    }

    if (vendor.status === "BLOCKED" || vendor.status === "CANCELLED") {
      return NextResponse.json(
        { error: "This vendor cannot receive quotation requests" },
        { status: 400 },
      );
    }

    const normalized = rawItems.map((item) => {
      const productId = toPositiveInt(item.productId);
      const quantity = toPositiveInt(item.quantity);
      if (!productId || !quantity) return null;

      return {
        productId,
        productVariantId: toPositiveInt(item.productVariantId),
        quantity,
        requestedUnitPrice: toPrice(item.requestedUnitPrice),
      };
    });

    if (normalized.some((item) => item === null)) {
      return NextResponse.json(
        { error: "Every line needs a product and a quantity of at least 1" },
        { status: 400 },
      );
    }

    const lines = normalized as NonNullable<(typeof normalized)[number]>[];
    const productIds = Array.from(new Set(lines.map((line) => line.productId)));

    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, vendorId },
      select: {
        id: true,
        name: true,
        variants: { select: { id: true } },
      },
    });

    if (products.length !== productIds.length) {
      return NextResponse.json(
        { error: "One or more products do not belong to this vendor" },
        { status: 400 },
      );
    }

    const productsById = new Map(products.map((product) => [product.id, product]));

    for (const line of lines) {
      const product = productsById.get(line.productId)!;

      if (product.variants.length > 0 && line.productVariantId == null) {
        return NextResponse.json(
          { error: `Choose a variant for ${product.name}` },
          { status: 400 },
        );
      }

      if (
        line.productVariantId != null &&
        !product.variants.some((variant) => variant.id === line.productVariantId)
      ) {
        return NextResponse.json(
          { error: "A selected variant does not belong to its product" },
          { status: 400 },
        );
      }
    }

    const session = await getAdminSession();
    const sessionAdminId = Number(session?.user?.id);
    const adminId =
      Number.isInteger(sessionAdminId) && sessionAdminId > 0 ? sessionAdminId : null;

    const quotation = await prisma.$transaction(async (tx) => {
      const created = await tx.quotation.create({
        data: {
          vendorId,
          adminId,
          requestNote,
          status: "REQUESTED",
          items: {
            create: lines.map((line) => ({
              productId: line.productId,
              productVariantId: line.productVariantId,
              name: productsById.get(line.productId)!.name,
              quantity: line.quantity,
              requestedUnitPrice: line.requestedUnitPrice,
            })),
          },
          events: {
            create: {
              status: "REQUESTED",
              title: "Quotation requested",
              message: requestNote ?? "Admin requested a price for the listed stock.",
              actor: "ADMIN",
            },
          },
        },
        include: QUOTATION_INCLUDE,
      });

      await tx.notification.create({
        data: {
          vendorId,
          type: "QUOTATION",
          message: `Admin requested a stock quotation (${quotationRef(created.id)}).`,
        },
      });

      return created;
    });

    await sendQuotationEmail({
      to: vendor.email,
      subject: `Stock quotation request ${quotationRef(quotation.id)}`,
      heading: "New stock quotation request",
      intro: `You have a new stock request from the admin. Review the items and send your price, or reject the request.`,
      quotationId: quotation.id,
      statusLabel: "Awaiting your quotation",
      vendorName: vendor.name,
      items: quotation.items.map((item) => ({
        name: item.name,
        quantity: item.quantity,
      })),
      note: requestNote,
      actionLabel: "Open quotation",
      actionUrl: `${process.env.VENDOR_APP_URL ?? "http://localhost:3001"}/dashboard/quotations`,
    });

    return NextResponse.json({ data: quotation }, { status: 201 });
  } catch (error) {
    console.error("[admin/quotations] POST failed", error);
    return NextResponse.json({ error: "Failed to create quotation" }, { status: 500 });
  }
}
