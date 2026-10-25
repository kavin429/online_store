import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { ROLES } from "@online-store/auth";

/**
 * The storefront only guards the signed-in customer area.
 * Everything under /account requires a CUSTOMER session.
 */
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const token = await getToken({
    req,
    secret: process.env.NEXTAUTH_SECRET,
  });

  if (!token || token.role !== ROLES.CUSTOMER) {
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/account/:path*", "/account"],
};
