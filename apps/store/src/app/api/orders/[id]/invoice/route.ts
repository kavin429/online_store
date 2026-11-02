import { NextRequest, NextResponse } from "next/server";
import { ROLES, requireRoleApi, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatLKR } from "@/lib/utils";

export const dynamic = "force-dynamic";

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function formatDate(value: Date) {
  return value.toLocaleDateString("en-LK", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireRoleApi(authOptions, ROLES.CUSTOMER);
    const userId = sessionUserId(session);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const orderId = Number(params.id);
    if (!Number.isInteger(orderId) || orderId <= 0) {
      return NextResponse.json({ error: "Invalid order." }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { items: true, user: { select: { name: true, email: true } } },
    });

    if (!order || order.userId !== userId) {
      return NextResponse.json({ error: "Order not found." }, { status: 404 });
    }

    const reference = `ORD-${String(order.id).padStart(5, "0")}`;
    const rows = order.items
      .map((item) => {
        const lineTotal = item.sellingPrice * item.quantity;
        return `
          <tr>
            <td>${escapeHtml(item.name)}</td>
            <td class="num">${escapeHtml(item.quantity)}</td>
            <td class="num">${escapeHtml(formatLKR(item.sellingPrice))}</td>
            <td class="num">${escapeHtml(formatLKR(lineTotal))}</td>
          </tr>`;
      })
      .join("");

    const html = `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Invoice ${escapeHtml(reference)}</title>
  <style>
    :root { color-scheme: light; }
    * { box-sizing: border-box; }
    body { margin: 0; padding: 32px; font-family: Arial, Helvetica, sans-serif; color: #27272a; background: #fafafa; }
    .sheet { max-width: 760px; margin: 0 auto; background: #fff; border: 1px solid #e4e4e7; border-radius: 12px; padding: 32px; }
    .top { display: flex; align-items: flex-start; justify-content: space-between; gap: 24px; border-bottom: 2px solid #a21caf; padding-bottom: 16px; }
    .brand { font-size: 22px; font-weight: 800; color: #a21caf; }
    .muted { color: #71717a; font-size: 13px; }
    h1 { margin: 24px 0 4px; font-size: 20px; }
    .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; margin: 20px 0; }
    .grid h2 { margin: 0 0 4px; font-size: 12px; text-transform: uppercase; letter-spacing: .08em; color: #71717a; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; }
    th, td { text-align: left; padding: 10px 8px; border-bottom: 1px solid #e4e4e7; font-size: 14px; }
    th { background: #fdf4ff; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; color: #86198f; }
    .num { text-align: right; white-space: nowrap; }
    .totals { margin: 20px 0 0 auto; width: 280px; }
    .totals div { display: flex; justify-content: space-between; padding: 6px 0; font-size: 14px; }
    .totals .total { border-top: 2px solid #a21caf; margin-top: 6px; padding-top: 10px; font-size: 17px; font-weight: 700; }
    .actions { max-width: 760px; margin: 20px auto 0; display: flex; justify-content: flex-end; }
    button { border: 0; border-radius: 8px; background: #a21caf; color: #fff; padding: 10px 18px; font-size: 14px; font-weight: 600; cursor: pointer; }
    @media print {
      body { background: #fff; padding: 0; }
      .sheet { border: 0; padding: 0; }
      .actions { display: none; }
    }
  </style>
</head>
<body>
  <div class="sheet">
    <div class="top">
      <div>
        <div class="brand">GrowMore Online Store</div>
        <div class="muted">Tax invoice</div>
      </div>
      <div style="text-align:right">
        <div style="font-weight:700">${escapeHtml(reference)}</div>
        <div class="muted">${escapeHtml(formatDate(order.createdAt))}</div>
        <div class="muted">Status: ${escapeHtml(order.status)}</div>
      </div>
    </div>

    <h1>Invoice</h1>

    <div class="grid">
      <div>
        <h2>Billed to</h2>
        <div>${escapeHtml(order.fullName || order.user.name)}</div>
        <div class="muted">${escapeHtml(order.email)}</div>
        <div class="muted">${escapeHtml(order.phone)}</div>
      </div>
      <div>
        <h2>Ship to</h2>
        <div>${escapeHtml(order.address)}</div>
        <div class="muted">${escapeHtml(order.city)} ${escapeHtml(order.postalCode)}</div>
        <div class="muted">Payment: ${escapeHtml(
          order.paymentMethod === "cod" ? "Cash on delivery" : "Card payment"
        )}</div>
      </div>
    </div>

    <table>
      <thead>
        <tr><th>Item</th><th class="num">Qty</th><th class="num">Unit price</th><th class="num">Amount</th></tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>

    <div class="totals">
      <div><span>Subtotal</span><span>${escapeHtml(formatLKR(order.subtotal))}</span></div>
      <div><span>Shipping</span><span>${escapeHtml(
        order.shipping === 0 ? "Free" : formatLKR(order.shipping)
      )}</span></div>
      ${
        order.discountAmount > 0
          ? `<div><span>Promo ${escapeHtml(order.promoCode ?? "")}</span><span>-${escapeHtml(
              formatLKR(order.discountAmount)
            )}</span></div>`
          : ""
      }
      <div class="total"><span>Total</span><span>${escapeHtml(formatLKR(order.total))}</span></div>
    </div>
  </div>

  <div class="actions">
    <button onclick="window.print()">Print invoice</button>
  </div>
</body>
</html>`;

    return new NextResponse(html, {
      status: 200,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  } catch (error) {
    if (error instanceof Response) return error;
    console.error("[orders/:id/invoice] failed", error);
    return NextResponse.json({ error: "Could not create this invoice." }, { status: 500 });
  }
}
