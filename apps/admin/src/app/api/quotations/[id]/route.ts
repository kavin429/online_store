import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import {
  formatQuotationMoney,
  quotationRef,
  sendQuotationEmail,
} from "@/lib/quotation-email";

export const dynamic = "force-dynamic";

const VALID_ACTIONS = [
  "accept",
  "reject",
  "assign_driver",
  "mark_picked_up",
  "mark_received",
  "cancel",
] as const;

type QuotationAction = (typeof VALID_ACTIONS)[number];

function vendorUrl() {
  return `${process.env.VENDOR_APP_URL ?? "http://localhost:3001"}/dashboard/quotations`;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } },
) {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const id = Number(params.id);
    if (!Number.isInteger(id) || id <= 0) {
      return NextResponse.json({ error: "Invalid quotation id" }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const action = String(body.action ?? "") as QuotationAction;

    if (!VALID_ACTIONS.includes(action)) {
      return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    }

    const quotation = await prisma.quotation.findUnique({
      where: { id },
      include: {
        vendor: { select: { id: true, name: true, email: true } },
        driver: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            vehicleType: true,
            vehicleNumber: true,
            status: true,
          },
        },
        items: { orderBy: { id: "asc" } },
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Quotation not found" }, { status: 404 });
    }

    const note =
      typeof body.note === "string" && body.note.trim() ? body.note.trim() : null;

    // ── Admin accepts the price quoted by the vendor ──
    if (action === "accept") {
      if (quotation.status !== "QUOTED") {
        return NextResponse.json(
          { error: "Only a vendor quotation can be accepted" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "ACCEPTED",
            acceptedAt: new Date(),
            acceptedTotal: quotation.quotedTotal,
            adminNote: note ?? quotation.adminNote,
            events: {
              create: {
                status: "ACCEPTED",
                title: "Quotation accepted",
                message:
                  note ??
                  `Admin accepted the total of ${formatQuotationMoney(
                    quotation.quotedTotal,
                  )}.`,
                actor: "ADMIN",
              },
            },
          },
          include: {
            vendor: { select: { id: true, name: true, email: true } },
            driver: { select: { id: true, name: true } },
            items: { orderBy: { id: "asc" } },
            events: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.notification.create({
          data: {
            vendorId: quotation.vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)} was accepted. Please set a pickup date.`,
          },
        });

        return result;
      });

      await sendQuotationEmail({
        to: quotation.vendor.email,
        subject: `${quotationRef(id)} accepted — set a pickup date`,
        heading: "Your quotation was accepted",
        intro: `Admin accepted your quotation. Add the date when the stock will be ready so a driver can be assigned.`,
        quotationId: id,
        statusLabel: "Accepted — waiting for pickup date",
        vendorName: quotation.vendor.name,
        total: quotation.quotedTotal,
        note,
        actionLabel: "Set pickup date",
        actionUrl: vendorUrl(),
      });

      return NextResponse.json({ data: updated });
    }

    // ── Admin rejects the quotation ──
    if (action === "reject") {
      if (!["REQUESTED", "QUOTED"].includes(quotation.status)) {
        return NextResponse.json(
          { error: "This quotation can no longer be rejected" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "REJECTED",
            rejectionReason: note ?? "Rejected by admin",
            events: {
              create: {
                status: "REJECTED",
                title: "Quotation rejected",
                message: note ?? "Admin rejected the quotation.",
                actor: "ADMIN",
              },
            },
          },
          include: {
            vendor: { select: { id: true, name: true, email: true } },
            driver: { select: { id: true, name: true } },
            items: { orderBy: { id: "asc" } },
            events: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.notification.create({
          data: {
            vendorId: quotation.vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)} was rejected by admin.`,
          },
        });

        return result;
      });

      await sendQuotationEmail({
        to: quotation.vendor.email,
        subject: `${quotationRef(id)} was rejected`,
        heading: "Quotation rejected",
        intro: "Admin rejected this stock quotation.",
        quotationId: id,
        statusLabel: "Rejected",
        vendorName: quotation.vendor.name,
        note: note ?? quotation.rejectionReason,
        items: quotation.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          quotedUnitPrice: item.quotedUnitPrice,
        })),
      });

      return NextResponse.json({ data: updated });
    }

    // ── Admin assigns a driver to collect the stock ──
    if (action === "assign_driver") {
      if (!["ACCEPTED", "READY_FOR_PICKUP"].includes(quotation.status)) {
        return NextResponse.json(
          { error: "Accept the quotation and wait for a pickup date first" },
          { status: 400 },
        );
      }

      if (!quotation.pickupDate) {
        return NextResponse.json(
          { error: "The vendor has not set a pickup date yet" },
          { status: 400 },
        );
      }

      const driverId = Number(body.driverId);
      if (!Number.isInteger(driverId) || driverId <= 0) {
        return NextResponse.json({ error: "Please choose a driver" }, { status: 400 });
      }

      const driver = await prisma.driver.findUnique({
        where: { id: driverId },
        select: { id: true, name: true, status: true, email: true },
      });

      if (!driver) {
        return NextResponse.json({ error: "Driver not found" }, { status: 404 });
      }
      if (driver.status === "BLOCKED") {
        return NextResponse.json(
          { error: "This driver is blocked and cannot take pickups" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "DRIVER_ASSIGNED",
            driverId,
            assignedAt: new Date(),
            events: {
              create: {
                status: "DRIVER_ASSIGNED",
                title: "Driver assigned",
                message: `${driver.name} will collect the stock${
                  quotation.pickupDate
                    ? ` on ${new Date(quotation.pickupDate).toLocaleDateString()}`
                    : ""
                }.`,
                actor: "ADMIN",
              },
            },
          },
          include: {
            vendor: { select: { id: true, name: true, email: true } },
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                vehicleType: true,
                vehicleNumber: true,
              },
            },
            items: { orderBy: { id: "asc" } },
            events: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.notification.create({
          data: {
            vendorId: quotation.vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)}: ${driver.name} has been assigned for pickup.`,
          },
        });

        return result;
      });

      await sendQuotationEmail({
        to: quotation.vendor.email,
        subject: `${quotationRef(id)} — driver assigned`,
        heading: "Driver assigned for pickup",
        intro: `${updated.driver?.name ?? "A driver"} will collect this stock from you.`,
        quotationId: id,
        statusLabel: "Driver assigned",
        vendorName: quotation.vendor.name,
        pickupDate: quotation.pickupDate,
        driverName: updated.driver?.name,
        total: quotation.quotedTotal,
        items: quotation.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          quotedUnitPrice: item.quotedUnitPrice,
        })),
        actionLabel: "View quotation",
        actionUrl: vendorUrl(),
      });

      if (driver.email) {
        await sendQuotationEmail({
          to: driver.email,
          subject: `Stock pickup ${quotationRef(id)} assigned to you`,
          heading: "New stock pickup",
          intro: `Please collect the stock from ${
            quotation.vendor.name
          } and mark it picked up in the admin dashboard.`,
          quotationId: id,
          statusLabel: "Driver assigned",
          vendorName: quotation.vendor.name,
          pickupDate: quotation.pickupDate,
          total: quotation.quotedTotal,
          items: quotation.items.map((item) => ({
            name: item.name,
            quantity: item.quantity,
            quotedUnitPrice: item.quotedUnitPrice,
          })),
        });
      }

      return NextResponse.json({ data: updated });
    }

    // ── Admin marks the stock as collected from the vendor ──
    if (action === "mark_picked_up") {
      if (quotation.status !== "DRIVER_ASSIGNED") {
        return NextResponse.json(
          { error: "Assign a driver before marking this pickup" },
          { status: 400 },
        );
      }

      const updated = await prisma.quotation.update({
        where: { id },
        data: {
          status: "PICKED_UP",
          pickedUpAt: new Date(),
          events: {
            create: {
              status: "PICKED_UP",
              title: "Stock picked up",
              message:
                note ??
                `${quotation.driver?.name ?? "The driver"} collected the stock from ${
                  quotation.vendor.name
                }.`,
              actor: "ADMIN",
            },
          },
        },
        include: {
          vendor: { select: { id: true, name: true, email: true } },
          driver: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true,
              vehicleType: true,
              vehicleNumber: true,
            },
          },
          items: { orderBy: { id: "asc" } },
          events: { orderBy: { createdAt: "desc" } },
        },
      });

      return NextResponse.json({ data: updated });
    }

    // ── Admin receives the stock and restores inventory ──
    if (action === "mark_received") {
      if (quotation.status !== "PICKED_UP") {
        return NextResponse.json(
          { error: "The stock must be picked up before it can be received" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        for (const item of quotation.items) {
          if (item.productVariantId) {
            await tx.productVariant.update({
              where: { id: item.productVariantId },
              data: { stock: { increment: item.quantity } },
            });

            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });

            await tx.inventoryBatch.create({
              data: {
                productVariantId: item.productVariantId,
                quantity: item.quantity,
                remaining: item.quantity,
                batchNumber: quotationRef(id),
                note: `Received from vendor ${quotation.vendor.name}`,
              },
            });

            await tx.inventoryLog.create({
              data: {
                productVariantId: item.productVariantId,
                change: item.quantity,
                reason: "PURCHASE_RECEIVED",
                note: `${quotationRef(id)} from ${quotation.vendor.name}`,
              },
            });
          } else {
            await tx.product.update({
              where: { id: item.productId },
              data: { stock: { increment: item.quantity } },
            });
          }
        }

        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "RECEIVED",
            receivedAt: new Date(),
            events: {
              create: {
                status: "RECEIVED",
                title: "Stock received",
                message:
                  note ??
                  "Stock was received and the quantities were added back to inventory.",
                actor: "ADMIN",
              },
            },
          },
          include: {
            vendor: { select: { id: true, name: true, email: true } },
            driver: {
              select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                vehicleType: true,
                vehicleNumber: true,
              },
            },
            items: { orderBy: { id: "asc" } },
            events: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.notification.create({
          data: {
            vendorId: quotation.vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)} was received. Stock has been added back to inventory.`,
          },
        });

        return result;
      });

      await sendQuotationEmail({
        to: quotation.vendor.email,
        subject: `${quotationRef(id)} received — stock restored`,
        heading: "Stock received",
        intro:
          "The admin received the stock. Quantities have been restored in inventory and this purchase is complete.",
        quotationId: id,
        statusLabel: "Received",
        vendorName: quotation.vendor.name,
        total: quotation.quotedTotal,
        items: quotation.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          quotedUnitPrice: item.quotedUnitPrice,
        })),
      });

      return NextResponse.json({ data: updated });
    }

    // ── Admin cancels the request ──
    if (action === "cancel") {
      if (["RECEIVED", "REJECTED", "CANCELLED"].includes(quotation.status)) {
        return NextResponse.json(
          { error: "This quotation can no longer be cancelled" },
          { status: 400 },
        );
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.quotation.update({
          where: { id },
          data: {
            status: "CANCELLED",
            events: {
              create: {
                status: "CANCELLED",
                title: "Quotation cancelled",
                message: note ?? "Admin cancelled this stock request.",
                actor: "ADMIN",
              },
            },
          },
          include: {
            vendor: { select: { id: true, name: true, email: true } },
            driver: { select: { id: true, name: true } },
            items: { orderBy: { id: "asc" } },
            events: { orderBy: { createdAt: "desc" } },
          },
        });

        await tx.notification.create({
          data: {
            vendorId: quotation.vendorId,
            type: "QUOTATION",
            message: `${quotationRef(id)} was cancelled by admin.`,
          },
        });

        return result;
      });

      return NextResponse.json({ data: updated });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    console.error("[admin/quotations/:id] PATCH failed", error);
    return NextResponse.json({ error: "Failed to update quotation" }, { status: 500 });
  }
}
