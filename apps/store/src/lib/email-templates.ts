type OtpEmailOptions = {
  code: string;
  expiresInMinutes?: number;
  brandName?: string;
};

export function otpEmailTemplate({
  code,
  expiresInMinutes = 10,
  brandName = "GrowMore",
}: OtpEmailOptions) {
  const year = new Date().getFullYear();

  const text = `${brandName} verification code

Your verification code is ${code}.
It expires in ${expiresInMinutes} minutes.

If you didn't request this, you can safely ignore this email.`;

  const digits = code
    .split("")
    .map(
      (d) => `<td style="padding:0 4px;">
        <div style="width:44px;height:56px;line-height:56px;text-align:center;font-size:28px;font-weight:700;color:#a21caf;background:#fdf4ff;border:1.5px solid #f0abfc;border-radius:10px;font-family:'Courier New',monospace;">${d}</div>
      </td>`
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <meta name="color-scheme" content="light" />
  <title>${brandName} verification code</title>
</head>
<body style="margin:0;padding:0;background:#fdf4ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
  <!-- Preheader (inbox preview text) -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">
    Your ${brandName} verification code is ${code}. It expires in ${expiresInMinutes} minutes.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#fdf4ff;padding:32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(192,38,211,0.12);">

          <!-- Header -->
          <tr>
            <td align="center" style="background:#c026d3;background-image:linear-gradient(135deg,#a21caf 0%,#d946ef 100%);padding:32px 24px;">
              <div style="font-size:24px;font-weight:800;letter-spacing:0.5px;color:#ffffff;">${brandName}</div>
              <div style="margin-top:4px;font-size:13px;color:#fae8ff;">Secure account verification</div>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 32px 12px;text-align:center;">
              <h1 style="margin:0 0 8px;font-size:22px;color:#1f1f23;">Verify your email</h1>
              <p style="margin:0;font-size:15px;line-height:1.6;color:#52525b;">
                Use the code below to finish signing up. Don't share it with anyone.
              </p>
            </td>
          </tr>

          <!-- OTP digits -->
          <tr>
            <td align="center" style="padding:20px 32px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>${digits}</tr>
              </table>
            </td>
          </tr>

          <!-- Expiry -->
          <tr>
            <td align="center" style="padding:0 32px 28px;">
              <span style="display:inline-block;padding:6px 14px;font-size:13px;font-weight:600;color:#a21caf;background:#fae8ff;border-radius:999px;">
                ⏱ Expires in ${expiresInMinutes} minutes
              </span>
            </td>
          </tr>

          <!-- Divider + note -->
          <tr>
            <td style="padding:0 32px 32px;">
              <div style="border-top:1px solid #f5d0fe;padding-top:20px;font-size:13px;line-height:1.6;color:#71717a;text-align:center;">
                If you didn't request this code, you can safely ignore this email.
              </div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center" style="background:#fdf4ff;padding:18px 24px;font-size:12px;color:#a1a1aa;">
              © ${year} ${brandName}. All rights reserved.
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  return { subject: `${code} is your ${brandName} verification code`, text, html };
}