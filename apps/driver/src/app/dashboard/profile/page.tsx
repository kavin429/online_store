import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { currentDriver } from "@/lib/auth";
import DriverProfile from "@/components/DriverProfile";

export const dynamic = "force-dynamic";

export default async function DriverProfilePage() {
  const auth = await currentDriver();
  if (!auth) redirect("/login");

  const driver = await prisma.driver.findUnique({
    where: { id: auth.id },
    select: {
      name: true,
      username: true,
      email: true,
      phone: true,
      vehicleType: true,
      vehicleNumber: true,
      licenseNumber: true,
      isAvailable: true,
      status: true,
    },
  });

  if (!driver) redirect("/login");

  return <DriverProfile driver={driver} />;
}
