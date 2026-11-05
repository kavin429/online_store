import { redirect } from "next/navigation";
import { getDriverSession, currentDriver } from "@/lib/auth";
import DriverTopBar from "@/components/DriverTopBar";
import DriverMobileNav from "@/components/DriverMobileNav";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getDriverSession();
  if (!session?.user) redirect("/login");

  const driver = await currentDriver();
  if (!driver) redirect("/login");

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-neutral-900">
      <DriverTopBar name={driver.name} />
      <main className="mx-auto w-full max-w-5xl px-4 py-6 pb-24 sm:pb-6">{children}</main>
      <DriverMobileNav />
    </div>
  );
}
