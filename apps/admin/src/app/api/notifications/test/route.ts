import { NextResponse } from "next/server";
import { sendPushToAdmin } from "@/lib/push";

import { isAdmin } from "@/lib/auth";
export const runtime = "nodejs";

async function sendTestPush() {
  try {
    await sendPushToAdmin({
      title: "Admin notifications are working",
      body: "This is a test notification from your dashboard.",
      url: "/dashboard",
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Test push error:", error);
    return NextResponse.json(
      { error: "Failed to send test notification" },
      { status: 500 },
    );
  }
}

export async function POST() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return sendTestPush();
}

export async function GET() {
  if (!(await isAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return sendTestPush();
}
