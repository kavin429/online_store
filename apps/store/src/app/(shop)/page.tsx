import HomeBanner from "@/components/Home/home-banner";
import { getActiveOffers } from "@/lib/offers";
import { getFlashDeals } from "@/lib/flash-deals";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [offers, flashDeals] = await Promise.all([
    getActiveOffers({ landingOnly: true }),
    getFlashDeals(),
  ]);

  return (
    <HomeBanner
      offers={offers}
      flashDeals={flashDeals.deals}
      flashEndsAt={flashDeals.endsAt}
      flashViewAllHref={flashDeals.viewAllHref}
    />
  );
}
