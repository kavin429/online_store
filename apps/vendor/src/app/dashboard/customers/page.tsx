import CustomerMain from "@/components/customer/main";
import { prisma } from "@/lib/prisma";

export default async function CustomersPage() {
  const customers = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      image: true,
      email: true,
      phone: true,
      country: true,
      province: true,
      district: true,
      city: true,
      address: true,
      status: true,
      blockReason: true,
      blockedAt: true,
      createdAt: true,
    },
  });

  return <CustomerMain data={JSON.parse(JSON.stringify(customers))} />;
}