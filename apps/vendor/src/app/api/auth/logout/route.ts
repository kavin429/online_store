import { NextResponse } from "next/server";
import { serialize } from "cookie";

export async function POST() {
  const vendorSessionCookie = serialize("vendor_session", "", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 0,
  });

  const res = NextResponse.json({ message: "Logged out" });
  res.headers.append("Set-Cookie", vendorSessionCookie);
  return res;
}
