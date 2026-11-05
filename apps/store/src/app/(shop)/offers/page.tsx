import { getActiveOffers } from "@/lib/offers";
import OffersClient from "@/components/offer/offers-client";
import Link from "next/link";
import { Gift, Bell, ArrowRight } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OfferPage() {
  const offers = await getActiveOffers();

  if (offers.length === 0) {
    return (
      <div className="relative flex min-h-[70vh] items-center justify-center overflow-hidden bg-gradient-to-br from-fuchsia-50 via-white to-amber-50 px-6 py-20 mt-5 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
        {/* Decorative background blobs */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-fuchsia-300/30 blur-3xl motion-safe:animate-pulse dark:bg-fuchsia-600/20" />
        <div className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-amber-200/40 blur-3xl motion-safe:animate-pulse dark:bg-amber-500/10" />

        <div className="relative w-full max-w-md rounded-3xl border border-fuchsia-100 bg-white/70 p-10 text-center shadow-xl shadow-fuchsia-500/10 backdrop-blur-xl dark:border-white/10 dark:bg-zinc-900/60 dark:shadow-fuchsia-500/5">
          {/* Icon */}
          <div className="relative mx-auto mb-6 flex h-24 w-24 items-center justify-center">
            <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-fuchsia-500 to-pink-500 opacity-30 blur-xl" />
            <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl bg-gradient-to-br from-fuchsia-500 via-fuchsia-600 to-purple-600 shadow-lg shadow-fuchsia-500/40">
              <Gift className="h-11 w-11 text-white" strokeWidth={1.75} />
            </div>
          </div>

          {/* Badge */}
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-fuchsia-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:bg-fuchsia-500/15 dark:text-fuchsia-300">
            <span className="h-1.5 w-1.5 rounded-full bg-fuchsia-500 motion-safe:animate-pulse" />
            Coming soon
          </span>

          {/* Text */}
          <h1 className="mb-2 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-50">
            No offers right now
          </h1>
          <p className="mx-auto mb-8 max-w-xs text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">
            New deals are on the way. Check back soon or turn on notifications so
            you never miss one.
          </p>

          {/* Actions */}
          <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              href="/"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-fuchsia-500/30 transition hover:from-fuchsia-500 hover:to-purple-500 hover:shadow-fuchsia-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
            >
              Explore plans
              <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Link>

            <button
              type="button"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-5 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 dark:border-white/10 dark:bg-white/5 dark:text-fuchsia-300 dark:hover:bg-white/10 dark:focus-visible:ring-offset-zinc-900"
            >
              <Bell className="h-4 w-4" />
              Notify me
            </button>
          </div>
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
