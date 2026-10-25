import { getServerSession } from "next-auth";
import { adminAuthOptions, ROLES } from "@online-store/auth";

export const authOptions = adminAuthOptions;
export { adminAuthOptions };

export async function getAdminSession() {
  return getServerSession(adminAuthOptions);
}

export async function isAdmin() {
  const session = await getServerSession(adminAuthOptions);
  return session?.user?.role === ROLES.ADMIN;
}
