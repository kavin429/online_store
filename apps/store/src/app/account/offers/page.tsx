"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TicketPercent, CalendarClock } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";

type ClaimedOffer = {
  id: number;
  claimedAt: string;
  offer: {
    id: number;
    title: string;
    subtitle: string | null;
    description: string | null;
    image: string | null;
    badgeText: string | null;
    ctaText: string;
    ctaLink: string | null;
    endsAt: string | null;
    promoCode: string | null;
    products: {
      id: number;
      name: string;
      sellingPrice: number | null;
      discountPercent: number | null;
    }[];
  };
};

export default function ClaimedOffersPage() {
  const [claims, setClaims] = useState<ClaimedOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/offers/claim");
        const data = await res.json();

        if (!res.ok) {
          setError(data.error || "Could not load claimed offers");
          return;
        }

        setClaims(data.claims ?? []);
      } catch {
        setError("Could not load claimed offers");
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  if (loading) {
    return (
      <p className="py-24 text-center text-gray-400">Loading your offers...</p>
    );
  }

  if (error) {
    return <p className="py-24 text-center text-red-500">{error}</p>;
  }

  if (claims.length === 0) {
    return (
      <div className="py-24 text-center">
        <TicketPercent className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          No claimed offers yet
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Browse the latest deals and claim the ones you like.
        </p>
        <Link href="/offer">
          <Button variant="shoe">Browse offers</Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Claimed Offers
      </h1>

      <div className="space-y-4">
        {claims.map((claim) => (
          <Card
            key={claim.id}
            className="p-5 border border-fuchsia-100 dark:border-fuchsia-900/40"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  {claim.offer.badgeText && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                      {claim.offer.badgeText}
                    </span>
                  )}
                  {claim.offer.promoCode && (
                    <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      Code: {claim.offer.promoCode}
                    </span>
                  )}
                </div>

                <h2 className="mt-2 font-semibold text-gray-900 dark:text-gray-100">
                  {claim.offer.title}
                </h2>

                {claim.offer.subtitle && (
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {claim.offer.subtitle}
                  </p>
                )}

                {claim.offer.endsAt && (
                  <p className="mt-2 flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
                    <CalendarClock className="h-3.5 w-3.5" />
                    Ends{" "}
                    {new Date(claim.offer.endsAt).toLocaleDateString("en-LK", {
                      day: "numeric",
                      month: "short",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>

              {claim.offer.ctaLink && (
                <Link href={claim.offer.ctaLink}>
                  <Button variant="shoesecondary">
                    {claim.offer.ctaText || "Shop Now"}
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
