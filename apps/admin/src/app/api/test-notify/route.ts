import { NextResponse } from "next/server";
import { sendEmail, sendSMS } from "@/lib/notify";

import { isAdmin } from "@/lib/auth";
export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results: Record<string, string> = {};

  try {
    await sendEmail(
      process.env.ADMIN_NOTIFY_EMAIL!,
      "Test Notification",
      "<p>✅ Email notification is working!</p>"
    );
    results.email = "✅ sent";
  } catch (err) {
    results.email = `❌ failed: ${err instanceof Error ? err.message : err}`;
  }

  try {
    await sendSMS(
      process.env.ADMIN_NOTIFY_PHONE!,
      "✅ SMS notification is working!"
    );
    results.sms = "✅ sent";
  } catch (err) {
    results.sms = `❌ failed: ${err instanceof Error ? err.message : err}`;
  }

  return NextResponse.json(results);
}
