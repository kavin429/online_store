import HomeBanner from "@/components/Home/home-banner";
import { getActiveOffers } from "@/lib/offers";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const offers = await getActiveOffers({ landingOnly: true });

  return <HomeBanner offers={offers} />;
}
