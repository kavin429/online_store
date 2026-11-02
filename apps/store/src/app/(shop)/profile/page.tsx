import { redirect } from "next/navigation";
import { ROLES, requireRole, sessionUserId } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { getProfileData } from "@/lib/profile";
import { ProfileClient } from "@/components/profile/ProfileClient";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await requireRole(authOptions, ROLES.CUSTOMER, "/login");
  const userId = sessionUserId(session);

  if (!userId) redirect("/login");

  const data = await getProfileData(userId);
  if (!data) redirect("/login");

  return <ProfileClient data={data} />;
}
