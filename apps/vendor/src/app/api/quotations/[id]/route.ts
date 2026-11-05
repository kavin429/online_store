import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getVendorIdFromRequest } from "@/lib/session";
import {
  formatQuotationDate,
  formatQuotationMoney,
  quotationRef,
  sendQuotationAdminEmail,
  uniqueEmails,
} from "@/lib/quotation-email";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = ["submit_quote", "reject", "set_pickup_date"] as const;
type VendorAction = (typeof VALID_ACTIONS)[number];

function toPrice(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Math.round(parsed * 100) / 100;
}

function todayDateString() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

async function adminRecipients() {
  const admins = await prisma.admin.findMany({
    select: { email: true },
  }).catch(() => [] as { email: string }[]);

  const envEmails = (process.env.ADMIN_NOTIFY_EMAIL ?? "")
    .split(",")
    .map((email) => email.trim())
    .filter(Boolean);

  return uniqueEmails(...envEmails, ...admins.map((admin) => admin.email));
}

const INCLUDE = {
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

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  const vendorId = getVendorIdFromRequest(req);
  if (!vendorId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid quotation id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "") as VendorAction;

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findFirst({
      where: { id, vendorId },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        items: { orderBy: { id: "asc" } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const note =
      typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    // ── Vendor submits (or updates) the price quotation ──
    if (action === "submit_quote") {
      if (!["REQUESTED", "QUOTED"].includes(quotation.status)) {
        return NextResponse.json(
          { error: "This quotation can no longer be changed" },
          { status: 400 },
        );
      }

      const rawItems = Array.isArray(body.items) ? body.items : [];
      const prices = new Map<number, number>();

      for (const raw of rawItems) {
        const itemId = Number(raw?.id);
        const price = toPrice(raw?.quotedUnitPrice);

        if (!Number.isInteger(itemId) || itemId <= 0) {
          return NextResponse.json({ error: "Invalid quotation item" }, { status: 400 });
        }
        if (price === null) {
          return NextResponse.json(
            { error: "Enter a valid unit price for every item" },
            { status: 400 },
          );
        }

        prices.set(itemId, price);
      }

      if (prices.size !== quotation.items.length) {
        return NextResponse.json(
          { error: "Enter a price for every item in the request" },
          { status: 400 },
        );
      }

      const itemIds = new Set(quotation.items.map((item) => item.id));
      for (const itemId of prices.keys()) {
        if (!itemIds.has(itemId)) {
          return NextResponse.json({ error: "Invalid quotation item" }, { status: 400 });
        }
      }

      const quotedTotal = Math.round(
        quotation.items.reduce(
          (sum, item) => sum + (prices.get(item.id) ?? 0) * item.quantity,
          0,
        ) * 100,
      ) / 100;

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of quotation.items) {
          await tx.quotationItem.update({
            where: { id: item.id },
            data: { quotedUnitPrice: prices.get(item.id) ?? 0 },
          });
        }

        return tx.quotation.update({
          where: { id },
          data: {
            status: "QUOTED",
            quotedTotal,
            vendorNote: note,
            events: {
              create: {
                status: "QUOTED",
                title: "Quotation submitted",
                message: `Vendor quoted ${formatQuotationMoney(quotedTotal)}.`,
                actor: "VENDOR",
              },
            },
          },
          include: INCLUDE,
        });
      });

      const to = await adminRecipients();
      await sendQuotationAdminEmail({
        to,
        subject: `Quotation ${quotationRef(id)} submitted by ${quotation.vendor.name}`,
        heading: "Vendor submitted a quotation",
        intro: `Review the prices from ${
          quotation.vendor.name
        }, then accept or reject the quotation.`,
        quotationId: id,
        statusLabel: "Quoted — awaiting admin review",
        vendorName: quotation.vendor.name,
        total: quotedTotal,
        note,
        items: updated.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          quotedUnitPrice: item.quotedUnitPrice,
        })),
      });

      return NextResponse.json({ data: updated });
    }

    // ── Vendor rejects the request ──
    if (action === "reject") {
      if (!["REQUESTED", "QUOTED"].includes(quotation.status)) {
        return NextResponse.json(
          { error: "This quotation can no longer be rejected" },
          { status: 400 },
        );
      }

      const reason = note ?? "Rejected by vendor";

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: reason,
            events: {
              create: {
                status: "REJECTED",
                title: "Quotation rejected",
                message: reason,
                actor: "VENDOR",
              },
            },
          },
          include: INCLUDE,
        });

        await tx.notification.create({
          data: {
            vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)} was rejected.`,
          },
        });

        return result;
      });

      const to = await adminRecipients();
      await sendQuotationAdminEmail({
        to,
        subject: `Quotation ${quotationRef(id)} rejected by ${quotation.vendor.name}`,
        heading: "Vendor rejected the quotation",
        intro: `${quotation.vendor.name} rejected the stock request.`,
        quotationId: id,
        statusLabel: "Rejected",
        vendorName: quotation.vendor.name,
        note: reason,
      });

      return NextResponse.json({ data: updated });
    }

    // ── Vendor gives the pickup date and marks the stock ready ──
    if (action === "set_pickup_date") {
      if (!["ACCEPTED", "READY_FOR_PICKUP"].includes(quotation.status)) {
        return NextResponse.json(
          { error: "The admin must accept the quotation first" },
          { status: 400 },
        );
      }

      const raw = String(body.pickupDate ?? "");
      let pickupDate: Date;

      if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
        if (raw < todayDateString()) {
          return NextResponse.json(
            { error: "Pickup date cannot be in the past" },
            { status: 400 },
          );
        }
        pickupDate = new Date(`${raw}T12:00:00.000Z`);
      } else {
        const parsed = new Date(raw);
        if (Number.isNaN(parsed.getTime())) {
          return NextResponse.json({ error: "Choose a valid pickup date" }, { status: 400 });
        }
        if (parsed.getTime() < Date.now() - 24 * 60 * 60 * 1000) {
          return NextResponse.json(
            { error: "Pickup date cannot be in the past" },
            { status: 400 },
          );
        }
        pickupDate = parsed;
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "READY_FOR_PICKUP",
            pickupDate,
            readyAt: new Date(),
            events: {
              create: {
                status: "READY_FOR_PICKUP",
                title: "Ready for pickup",
                message: `Stock will be ready on ${formatQuotationDate(
                  pickupDate,
                )}. The admin can now assign a driver.`,
                actor: "VENDOR",
              },
            },
          },
          include: INCLUDE,
        });

        await tx.notification.create({
          data: {
            vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)} is ready for pickup on ${formatQuotationDate(
              pickupDate,
            )}.`,
          },
        });

        return result;
      });

      const to = await adminRecipients();
      await sendQuotationAdminEmail({
        to,
        subject: `Stock ready for pickup — ${quotationRef(id)}`,
        heading: "Stock is ready for pickup",
        intro: `${quotation.vendor.name} has set the pickup date. Assign a driver to collect the order.`,
        quotationId: id,
        statusLabel: "Ready for pickup",
        vendorName: quotation.vendor.name,
        total: quotation.quotedTotal,
        pickupDate,
        note,
        items: updated.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          quotedUnitPrice: item.quotedUnitPrice,
        })),
      });

      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("[vendor/quotations/:id] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}
