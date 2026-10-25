import NextAuth from "next-auth";
import { adminAuthOptions } from "@online-store/auth";

const handler = NextAuth(adminAuthOptions);

export { handler as GET, handler as POST };
