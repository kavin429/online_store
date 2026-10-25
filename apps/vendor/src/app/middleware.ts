import { NextRequest, NextResponse } from "next/server";

export function middleware(req: NextRequest) {
  const vendorSession = req.cookies.get("vendor_session")?.value;

  if (req.nextUrl.pathname.startsWith("/dashboard")) {
    if (!vendorSession) return NextResponse.redirect(new URL("/login", req.url));
  }

  if (req.nextUrl.pathname === "/login" && vendorSession) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/login"],
};
