import { sendMail } from "@/lib/email";

export function quotationRef(id: number) {
  return `QUO-${String(id).padStart(5, "0")}`;
}

export function formatQuotationMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `Rs. ${Number(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatQuotationDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function uniqueEmails(...values: Array<string | null | undefined>) {
  return Array.from(
    new Set(
      values
        .filter((value): value is string => !!value && value.includes("@"))
        .map((value) => value.trim()),
    ),
  );
}

type ItemLine = {
  name: string;
  quantity: number;
  quotedUnitPrice?: number | null;
};

type AdminQuotationEmailInput = {
  to: string | string[];
  subject: string;
  heading: string;
  intro: string;
  quotationId: number;
  statusLabel: string;
  vendorName: string;
  total?: number | null;
  pickupDate?: Date | string | null;
  items?: ItemLine[];
  note?: string | null;
};

export async function sendQuotationAdminEmail(input: AdminQuotationEmailInput) {
  const to = Array.isArray(input.to) ? input.to.filter(Boolean).join(", ") : input.to;
  if (!to) return false;

  const rows = (input.items ?? [])
    .map(
      (item) => `
        <tr>
          <td style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#111827;">${escapeHtml(
            item.name,
          )}</td>
          <td align="center" style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${item.quantity}</td>
          <td align="right" style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${formatQuotationMoney(
            item.quotedUnitPrice,
          )}</td>
        </tr>`,
    )
    .join("");

  const metaRows: Array<[string, string]> = [
    ["Quotation", quotationRef(input.quotationId)],
    ["Status", input.statusLabel],
    ["Vendor", input.vendorName],
  ];
  if (input.total != null) {
    metaRows.push(["Quoted total", formatQuotationMoney(input.total)]);
  }
  if (input.pickupDate) {
    metaRows.push(["Pickup date", formatQuotationDate(input.pickupDate)]);
  }

  const meta = metaRows
    .map(
      ([label, value]) => `
        <tr>
          <td style="padding:5px 0;font-size:13px;color:#6b7280;">${escapeHtml(String(label))}</td>
          <td align="right" style="padding:5px 0;font-size:13px;font-weight:600;color:#111827;">${escapeHtml(String(value))}</td>
        </tr>`,
    )
    .join("");

  const note = input.note
    ? `<div style="margin-top:18px;padding:12px 14px;border-radius:8px;background:#f5f3ff;border:1px solid #ddd6fe;font-size:13px;color:#374151;"><strong>Note:</strong> ${escapeHtml(
        input.note,
      )}</div>`
    : "";

  const actionUrl = `${process.env.NEXTAUTH_URL ?? "http://localhost:3002"}/dashboard/orders`;

  const html = `
    <div style="margin:0;padding:24px;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px;border:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">${escapeHtml(
          input.heading,
        )}</p>
        <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">${escapeHtml(input.intro)}</p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;border-top:1px solid #e5e7eb;padding-top:14px;">
          ${meta}
        </table>
        ${
          rows
            ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                <thead>
                  <tr>
                    <th align="left" style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;">Item</th>
                    <th align="center" style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;">Qty</th>
                    <th align="right" style="padding:8px 0;border-bottom:1px solid #e5e7eb;font-size:11px;text-transform:uppercase;letter-spacing:.04em;color:#6b7280;">Unit price</th>
                  </tr>
                </thead>
                <tbody>${rows}</tbody>
              </table>`
            : ""
        }
        ${note}
        <a href="${escapeHtml(
          actionUrl,
        )}" style="display:inline-block;margin-top:22px;padding:11px 20px;border-radius:8px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Open purchase orders</a>
        <p style="margin:26px 0 0;font-size:12px;color:#9ca3af;">GrowMore Online Store · Stock quotations</p>
      </div>
    </div>`;

  return sendMail({
    to,
    subject: input.subject,
    text: `${input.heading}\n\n${input.intro}\n\nStatus: ${input.statusLabel}`,
    html,
  });
}
