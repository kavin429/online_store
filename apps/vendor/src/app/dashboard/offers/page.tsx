import { cookies } from "next/headers";
import OfferMain from "@/components/offers/main";
import { prisma } from "@/lib/prisma";

function serializeOffer<T extends { images?: string | null }>(offer: T) {
  let images: string[] = [];
  if (offer.images) {
    try {
      const parsed = JSON.parse(offer.images);
      images = Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
    } catch {
      images = [];
    }
  }
  return { ...offer, images };
}

export default async function OffersPage() {
  const vendorSessionRaw = cookies().get("vendor_session")?.value;
  let vendorId: number | null = null;

  if (vendorSessionRaw) {
    try {
      vendorId = JSON.parse(vendorSessionRaw).id;
    } catch {}
  }

  if (!vendorId) {
    return <OfferMain data={[]} products={[]} />;
  }

  const [offers, products] = await Promise.all([
    prisma.offer.findMany({
      where: { vendorId },
      orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
      include: {
        promo: { select: { id: true, code: true } },
        products: { include: { product: { select: { id: true, name: true } } } },
      },
    }),
    prisma.product.findMany({
      where: { vendorId },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  return (
    <OfferMain
      data={JSON.parse(JSON.stringify(offers.map(serializeOffer)))}
      products={products}
    />
  );
}
