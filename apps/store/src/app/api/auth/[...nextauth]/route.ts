import NextAuth from "next-auth";
import { storeAuthOptions } from "@online-store/auth";

const handler = NextAuth(storeAuthOptions);

export { handler as GET, handler as POST };
