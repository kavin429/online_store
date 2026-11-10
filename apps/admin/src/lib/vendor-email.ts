import { sendMail } from "@/lib/email";
import { getVendorLoginUrl } from "@/lib/vendors";

export type VendorActivationEmailInput = {
  to: string;
  vendorName: string;
  username: string;
  password: string;
  loginUrl?: string;
};

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function buildVendorActivationEmail(input: VendorActivationEmailInput) {
  const loginUrl = input.loginUrl || getVendorLoginUrl();
  const vendorName = input.vendorName?.trim() || "there";
  const subject = "Your vendor account is active — login details";

  const html = `
    <div style="margin:0;padding:24px;background:#eef2f7;font-family:Arial,Helvetica,sans-serif;">
      <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:14px;padding:28px;border:1px solid #e5e7eb;">
        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#111827;">Your vendor account is active</p>
        <p style="margin:0;font-size:14px;line-height:22px;color:#6b7280;">
          Hi ${escapeHtml(vendorName)}, your ${escapeHtml(
            "GrowMore Online Store",
          )} vendor account has been approved. You can now sign in with the credentials below.
        </p>

        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:22px;background:#f5f3ff;border:1px dashed #ddd6fe;border-radius:12px;">
          <tr>
            <td style="padding:18px 20px;">
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;font-weight:600;">Username</p>
              <p style="margin:0 0 14px;font-size:18px;font-weight:700;color:#4338ca;font-family:Consolas,monospace;">${escapeHtml(
                input.username,
              )}</p>
              <p style="margin:0 0 4px;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;color:#6b7280;font-weight:600;">Password</p>
              <p style="margin:0;font-size:18px;font-weight:700;color:#4338ca;font-family:Consolas,monospace;">${escapeHtml(
                input.password,
              )}</p>
            </td>
          </tr>
        </table>

        <p style="margin:22px 0 0;font-size:14px;line-height:22px;color:#374151;">
          Sign in here: <a href="${escapeHtml(
            loginUrl,
          )}" style="color:#4f46e5;font-weight:600;">${escapeHtml(loginUrl)}</a>
        </p>

        <a href="${escapeHtml(
          loginUrl,
        )}" style="display:inline-block;margin-top:18px;padding:11px 22px;border-radius:8px;background:#4f46e5;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;">Go to vendor login</a>

        <p style="margin:26px 0 0;font-size:12px;line-height:19px;color:#9ca3af;">
          For your security, change this password after your first sign in. If you did not expect this email, please contact the store administrator.
        </p>
      </div>
    </div>`;

  const text = [
    `Hi ${vendorName},`,
    "",
    "Your vendor account is active. You can now sign in with the credentials below.",
    "",
    `Username: ${input.username}`,
    `Password: ${input.password}`,
    "",
    `Login: ${loginUrl}`,
    "",
    "For your security, change this password after your first sign in.",
  ].join("\n");

  return { subject, text, html };
}

export async function sendVendorActivationEmail(input: VendorActivationEmailInput) {
  if (!input.to) return false;

  const { subject, text, html } = buildVendorActivationEmail(input);
  return sendMail({ to: input.to, subject, text, html });
}
