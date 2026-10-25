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
    <section>
      <TopNav user={user} />
      <div className="flex min-h-screen">
        <SideNav />
        <div className="container w-full pt-4 pb-24 md:py-4">{children}</div>
      </div>
    </section>
  );
}
