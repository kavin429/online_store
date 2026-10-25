// src/app/(admin)/offers/page.tsx  (put it next to your admin promos page)
import OfferMain from "@/components/offers/main";
import { prisma } from "@/lib/prisma";
import { serializeOffer } from "@/lib/offers";

export default async function OffersPage() {
  const [offers, products, promos] = await Promise.all([
    prisma.offer.findMany({
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        promo: { select: { id: true, code: true } },
        vendor: { select: { id: true, name: true } },
        products: { include: { product: { select: { id: true, name: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { status: { in: ["ACTIVE", "PENDING"] } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
    prisma.promo.findMany({
      where: { status: "ACTIVE" },
      select: { id: true, code: true },
      orderBy: { code: "asc" },
    }),
  ]);

  return (
    <OfferMain
      data={JSON.parse(JSON.stringify(offers.map(serializeOffer)))}
      products={products}
      promos={promos}
    />
  );
}