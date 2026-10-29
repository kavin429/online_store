import { sendMail } from "@/lib/email";

export type ExpiryNoticeInput = {
  vendorEmail?: string | null;
  vendorName?: string | null;
  productName: string;
  sku?: string | null;
  quantity: number;
  expiresAt: Date;
  batchNumber?: string | null;
  note?: string | null;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function formatDate(date: Date) {
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  });
}

function daysUntil(date: Date) {
  return Math.ceil((date.getTime() - Date.now()) / DAY_MS);
}

/**
 * Emails the owning vendor and the platform admin when a restock is recorded
 * with an expiry date, so short-dated stock can be sold or discounted in time.
 */
export async function sendExpiryNotice(input: ExpiryNoticeInput) {
  const recipients = Array.from(
    new Set(
      [input.vendorEmail, process.env.ADMIN_NOTIFY_EMAIL]
        .filter((value): value is string => Boolean(value && value.trim()))
        .map((value) => value.trim()),
    ),
  );

  if (recipients.length === 0) {
    return { sent: false, recipients: [] as string[] };
  }

  const days = daysUntil(input.expiresAt);
  const urgent = days <= 7;

  const stockLine = `${input.quantity} unit${input.quantity === 1 ? "" : "s"} of ${
    input.productName
  }${input.sku ? ` (${input.sku})` : ""} now expire on ${formatDate(input.expiresAt)}.`;

  const urgencyLine =
    days < 0
      ? `This batch expired ${Math.abs(days)} day${Math.abs(days) === 1 ? "" : "s"} ago.`
      : days === 0
        ? "This batch expires today."
        : `This batch expires in ${days} day${days === 1 ? "" : "s"}.`;

  const text = [
    `An expiry date was added to inventory.`,
    "",
    stockLine,
    urgencyLine,
    input.batchNumber ? `Batch: ${input.batchNumber}` : null,
    input.note ? `Note: ${input.note}` : null,
    "",
    urgent
      ? "Consider creating a clearance offer so this stock sells before it expires."
      : "Stock will be sold first-in-first-out, oldest expiry first.",
  ]
    .filter(Boolean)
    .join("\n");

  const html = `
    <div style="font-family:Arial,Helvetica,sans-serif;line-height:1.5;color:#111827">
      <h2 style="margin:0 0 12px;color:${urgent ? "#b91c1c" : "#111827"}">
        ${urgent ? "Expiring soon" : "Expiry date added"}
      </h2>
      <p style="margin:0 0 12px">${stockLine}</p>
      <table style="border-collapse:collapse;margin:0 0 16px">
        <tr>
          <td style="padding:4px 12px 4px 0;color:#6b7280">Product</td>
          <td style="padding:4px 0"><strong>${escapeHtml(input.productName)}</strong></td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;color:#6b7280">SKU</td>
          <td style="padding:4px 0">${escapeHtml(input.sku || "-")}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;color:#6b7280">Quantity</td>
          <td style="padding:4px 0">${input.quantity}</td>
        </tr>
        <tr>
          <td style="padding:4px 12px 4px 0;color:#6b7280">Expires</td>
          <td style="padding:4px 0">${formatDate(input.expiresAt)} (${urgencyLine})</td>
        </tr>
        ${
          input.batchNumber
            ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Batch</td><td style="padding:4px 0">${escapeHtml(
                input.batchNumber,
              )}</td></tr>`
            : ""
        }
        ${
          input.note
            ? `<tr><td style="padding:4px 12px 4px 0;color:#6b7280">Note</td><td style="padding:4px 0">${escapeHtml(
                input.note,
              )}</td></tr>`
            : ""
        }
      </table>
      <p style="margin:0;color:#6b7280;font-size:13px">
        ${
          urgent
            ? "Consider creating a clearance offer so this stock sells before it expires."
            : "Stock is sold first-in-first-out, oldest expiry first."
        }
      </p>
    </div>
  `;

  const subject = `${urgent ? "[Expiring soon] " : ""}Expiry added: ${
    input.productName
  }${input.sku ? ` (${input.sku})` : ""}`;

  const results = await Promise.all(
    recipients.map((to) => sendMail({ to, subject, text, html })),
  );

  return {
    sent: results.some(Boolean),
    recipients,
  };
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
