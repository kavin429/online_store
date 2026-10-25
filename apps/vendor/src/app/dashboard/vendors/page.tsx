import VendorMain from "@/components/vendors/main";
import { prisma } from "@/lib/prisma";

export default async function VendorPage() {
  const vendors = await prisma.vendor.findMany({
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
      password: true,
      plainPassword: true,
      status: true,
      blockReason: true,
      blockedAt: true,
      createdAt: true,
      vendorSettings: {
        select: {
          id: true,
          storeName: true,
          storeLogo: true,
          storeBanner: true,
          description: true,
          taxId: true,
          businessReg: true,
          bankName: true,
          accountName: true,
          accountNumber: true,
          branch: true,
        },
      },
      _count: { select: { products: true, payouts: true, notifications: true } },
    },
  });

  const data = vendors.map(({ _count, ...v }) => ({
    ...v,
    productsCount: _count.products,
    payoutsCount: _count.payouts,
    notificationsCount: _count.notifications,
  }));

  return <VendorMain data={JSON.parse(JSON.stringify(data))} />;
}