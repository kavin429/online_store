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
    <div className="min-h-screen bg-gradient-to-b from-fuchsia-50/40 via-gray-50 to-gray-50 dark:from-fuchsia-950/10 dark:via-neutral-950 dark:to-neutral-950">
      <DriverTopBar name={driver.name} />
      <main className="mx-auto w-full max-w-7xl px-4 py-6 pb-28 sm:px-6 sm:pb-10 lg:px-8 lg:py-8">
        {children}
      </main>
      <DriverMobileNav />
    </div>
  );
}
