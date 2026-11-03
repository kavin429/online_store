import NextAuth from "next-auth";
import { driverAuthOptions } from "@online-store/auth";

const handler = NextAuth(driverAuthOptions);

export { handler as GET, handler as POST };
