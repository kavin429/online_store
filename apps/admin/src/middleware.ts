import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { ROLES } from "@online-store/auth/types";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const role = token?.role;

    if (role !== ROLES.ADMIN) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*", "/dashboard"],
};
