import DriversMain from "@/components/drivers/main";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const drivers = await prisma.driver.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      username: true,
      email: true,
      phone: true,
      plainPassword: true,
      vehicleType: true,
      vehicleNumber: true,
      licenseNumber: true,
      note: true,
      status: true,
      isAvailable: true,
      lastLoginAt: true,
      currentLat: true,
      currentLng: true,
      locationUpdatedAt: true,
      createdAt: true,
      _count: { select: { deliveries: true } },
    },
  });

  const data = drivers.map(({ _count, ...driver }) => ({
    ...driver,
    deliveriesCount: _count.deliveries,
  }));

  return <DriversMain data={JSON.parse(JSON.stringify(data))} />;
}
