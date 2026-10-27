import { getActiveOffers } from "@/lib/offers";
import OffersClient from "@/components/offer/offers-client";

export const dynamic = "force-dynamic";

export default async function OfferPage() {
  const offers = await getActiveOffers();

  if (offers.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-amber-50 px-6 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎁</div>
          <h1 className="mb-2 text-3xl font-black text-zinc-900 dark:text-zinc-100">No offers right now</h1>
          <p className="text-zinc-500 dark:text-zinc-400">New deals are on the way — check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Hero banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-fuchsia-700 via-purple-800 to-zinc-950 py-20 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(217,70,239,0.25),_transparent_60%)]" />
        <div className="mx-auto max-w-7xl px-6 text-center">
          <span className="mb-4 inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest backdrop-blur-sm">
            Limited Time
          </span>
          <h1 className="text-4xl font-black leading-tight md:text-6xl">Special Offers</h1>
          <p className="mt-3 text-lg text-fuchsia-200">
            {offers.length} exclusive deal{offers.length !== 1 ? "s" : ""} — tap any card to explore.
          </p>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16">
        <OffersClient offers={offers} />
      </div>
    </main>
  );
}
