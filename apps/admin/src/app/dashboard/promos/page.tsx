import PromoMain from "@/components/promos/main";
import { prisma } from "@/lib/prisma";
import type { Promo } from "@/lib/types";

export default async function PromosPage() {
  const promos = await prisma.promo.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      targetCustomers: {
        include: {
          user: {
            select: { id: true, name: true, email: true, image: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      vendor: { select: { id: true, name: true } },
      admin: { select: { id: true, name: true } },
    },
  });

  return <PromoMain data={JSON.parse(JSON.stringify(promos)) as Promo[]} />;
}
