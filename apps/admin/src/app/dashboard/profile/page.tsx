import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { adminAuthOptions, ROLES } from "@online-store/auth";
import { prisma } from "@/lib/prisma";
import { AdminProfileForm } from "@/components/profile/AdminProfileForm";

export const dynamic = "force-dynamic";

export default async function AdminProfilePage() {
  const session = await getServerSession(adminAuthOptions);
  if (!session?.user || session.user.role !== ROLES.ADMIN) {
    redirect("/login");
  }

  const id = Number(session.user.id);
  const record =
    Number.isInteger(id) && id > 0
      ? await prisma.admin.findUnique({
          where: { id },
          select: { id: true, name: true, email: true, createdAt: true },
        })
      : null;

  const profile = record
    ? {
        id: record.id,
        name: record.name,
        email: record.email,
        createdAt: record.createdAt.toISOString(),
        readOnly: false,
      }
    : {
        id: 0,
        name: session.user.name ?? "Admin",
        email: session.user.email ?? "",
        createdAt: null,
        readOnly: true,
      };

  const [promos, replies] = record
    ? await Promise.all([
        prisma.promo.count({ where: { adminId: record.id } }),
        prisma.reviewResponse.count({ where: { adminId: record.id } }),
      ])
    : [0, 0];

  return <AdminProfileForm profile={profile} stats={{ promos, replies }} />;
}
