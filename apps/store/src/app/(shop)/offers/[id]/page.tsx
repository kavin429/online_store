import { notFound } from "next/navigation";
import { getActiveOffers } from "@/lib/offers";
import OfferDetail from "@/components/offer/offer-detail";

export const dynamic = "force-dynamic";

export default async function OfferDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const offers = await getActiveOffers();
  const offer = offers.find((o) => String(o.id) === id);
  if (!offer) notFound();

  return (
    <main>
      <OfferDetail offer={offer} showBack />
    </main>
  );
}