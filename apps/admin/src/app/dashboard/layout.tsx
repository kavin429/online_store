// src/app/dashboard/layout.tsx
import SideNav from "@/components/Navs/SideNav";
import TopNav from "@/components/Navs/TopNav";
import { getServerSession } from "next-auth";
import { adminAuthOptions, ROLES } from "@online-store/auth";
import { redirect } from "next/navigation";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(adminAuthOptions);

  if (!session || session.user?.role !== ROLES.ADMIN) {
    redirect("/login");
  }

  const user = {
    name: session.user?.name || "Admin",
  };

  return (
    <section className="flex h-screen flex-col overflow-hidden">
      <TopNav user={user} />
      <div className="flex flex-1 overflow-hidden">
        <SideNav />
        <div className="flex-1 min-w-0 overflow-y-auto pt-4 pb-24 md:py-4 px-4">{children}</div>
      </div>
    </section>
  );
}
