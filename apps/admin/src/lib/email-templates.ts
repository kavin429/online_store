import type { PromoDiscountType } from "@/lib/types";

export const PROMO_LOGO_CID = "store-logo";

const DEFAULT_STORE_NAME = "GrowMore Online Store";

const COLORS = {
  page: "#eef2f7",
  card: "#ffffff",
  brand: "#4f46e5",
  brandDark: "#4338ca",
  brandLight: "#7c3aed",
  text: "#111827",
  muted: "#6b7280",
  border: "#e5e7eb",
  codeBg: "#f5f3ff",
  codeBorder: "#ddd6fe",
};

export type PromoEmailInput = {
  recipientName?: string | null;
  storeName?: string;
  storeUrl?: string;
  promo: {
    code: string;
    name: string;
    description?: string | null;
    discountType: PromoDiscountType;
    discountValue: number;
    maxDiscount?: number | null;
    minOrderAmount?: number | null;
    startsAt?: Date | null;
    expiresAt?: Date | null;
    usageLimitPerUser?: number | null;
  };
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function formatCurrency(value: number) {
  return `Rs. ${value.toLocaleString("en-US", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })}`;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(value);
}

function getDiscountHeadline(discountType: PromoDiscountType, discountValue: number) {
  return discountType === "PERCENTAGE"
    ? `${discountValue}% OFF`
    : `${formatCurrency(discountValue)} OFF`;
}

type DetailRow = { label: string; value: string };

function buildDetails(promo: PromoEmailInput["promo"]): DetailRow[] {
  const details: DetailRow[] = [];

  if (promo.minOrderAmount != null) {
    details.push({ label: "Minimum order", value: formatCurrency(promo.minOrderAmount) });
  }

  if (promo.discountType === "PERCENTAGE" && promo.maxDiscount != null) {
    details.push({ label: "Maximum discount", value: formatCurrency(promo.maxDiscount) });
  }

  if (promo.expiresAt) {
    details.push({ label: "Valid until", value: formatDate(promo.expiresAt) });
  }

  if (promo.startsAt && promo.startsAt.getTime() > Date.now()) {
    details.push({ label: "Starts on", value: formatDate(promo.startsAt) });
  }

  if (promo.usageLimitPerUser != null) {
    details.push({ label: "Limit per customer", value: `${promo.usageLimitPerUser} use(s)` });
  }

  return details;
}

function renderDetailsTable(details: DetailRow[]) {
  if (details.length === 0) return "";

  const rows = details
    .map(
      (row, index) => `
              <tr>
                <td style="padding:${index === 0 ? "0" : "10px"} 0 0;font-size:13px;line-height:20px;color:${COLORS.muted};">${escapeHtml(
                  row.label,
                )}</td>
                <td align="right" style="padding:${index === 0 ? "0" : "10px"} 0 0;font-size:13px;line-height:20px;font-weight:600;color:${COLORS.text};">${escapeHtml(
                  row.value,
                )}</td>
              </tr>`,
    )
    .join("");

  return `
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;border-top:1px solid ${COLORS.border};padding-top:18px;">
${rows}
            </table>`;
}

export function buildPromoEmail(input: PromoEmailInput) {
  const { promo } = input;
  const storeName = input.storeName?.trim() || DEFAULT_STORE_NAME;
  const storeUrl = input.storeUrl?.trim() || "";
  const greetingName = input.recipientName?.trim();

  const headline = getDiscountHeadline(promo.discountType, promo.discountValue);
  const details = buildDetails(promo);
  const hasCta = Boolean(storeUrl);

  const subject = promo.name ? `${promo.name} — ${headline}` : `A new offer just for you — ${headline}`;

  const greeting = greetingName ? `Hi ${greetingName},` : "Hi there,";
  const description = promo.description?.trim();

  const html = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>${escapeHtml(subject)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${COLORS.page};font-family:'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${COLORS.page};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background-color:${COLORS.card};border-radius:16px;overflow:hidden;border:1px solid ${COLORS.border};box-shadow:0 8px 24px rgba(17,24,39,0.06);">
            <tr>
              <td align="center" style="background-color:${COLORS.brand};background-image:linear-gradient(135deg, ${COLORS.brand} 0%, ${COLORS.brandLight} 100%);padding:34px 32px 30px;">
                <img src="cid:${PROMO_LOGO_CID}" alt="${escapeHtml(
                  storeName,
                )}" width="84" height="84" style="display:block;border-radius:18px;background-color:#ffffff;padding:8px;object-fit:contain;" />
                <p style="margin:20px 0 0;font-size:12px;letter-spacing:2px;text-transform:uppercase;color:rgba(255,255,255,0.85);font-weight:600;">Exclusive offer</p>
                <p style="margin:8px 0 0;font-size:40px;line-height:44px;font-weight:800;color:#ffffff;">${escapeHtml(
                  headline,
                )}</p>
              </td>
            </tr>

            <tr>
              <td style="padding:32px 32px 8px;">
                <p style="margin:0 0 14px;font-size:15px;line-height:22px;color:${COLORS.text};">${escapeHtml(
                  greeting,
                )}</p>
                <h1 style="margin:0 0 10px;font-size:22px;line-height:28px;font-weight:700;color:${COLORS.text};">${escapeHtml(
                  promo.name,
                )}</h1>
                ${
                  description
                    ? `<p style="margin:0;font-size:15px;line-height:23px;color:${COLORS.muted};">${escapeHtml(
                        description,
                      )}</p>`
                    : ""
                }

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:24px;background-color:${COLORS.codeBg};border:1px dashed ${COLORS.codeBorder};border-radius:12px;">
                  <tr>
                    <td align="center" style="padding:18px 16px;">
                      <p style="margin:0 0 8px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:${COLORS.muted};font-weight:600;">Your promo code</p>
                      <p style="margin:0;font-size:26px;line-height:30px;font-weight:800;letter-spacing:3px;color:${COLORS.brandDark};">${escapeHtml(
                        promo.code,
                      )}</p>
                    </td>
                  </tr>
                </table>
                ${renderDetailsTable(details)}
              </td>
            </tr>

            ${
              hasCta
                ? `<tr>
              <td align="center" style="padding:26px 32px 6px;">
                <a href="${escapeHtml(
                  storeUrl,
                )}" style="display:inline-block;background-color:${COLORS.brand};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 40px;border-radius:10px;">Shop Now</a>
              </td>
            </tr>`
                : ""
            }

            <tr>
              <td style="padding:26px 32px 30px;">
                <p style="margin:0;padding-top:20px;border-top:1px solid ${COLORS.border};font-size:12px;line-height:19px;color:${COLORS.muted};text-align:center;">
                  You received this email because you have an account with ${escapeHtml(
                    storeName,
                  )}.<br />
                  &copy; ${new Date().getFullYear()} ${escapeHtml(storeName)}. All rights reserved.
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  const textLines = [
    greeting,
    "",
    promo.name,
    description ?? "",
    "",
    `Offer: ${headline}`,
    `Promo code: ${promo.code}`,
    ...details.map((row) => `${row.label}: ${row.value}`),
    hasCta ? "" : null,
    hasCta ? `Shop now: ${storeUrl}` : null,
    "",
    `You received this email because you have an account with ${storeName}.`,
  ].filter((line): line is string => line !== null);

  const text = textLines.join("\n");

  return { subject, text, html };
}
