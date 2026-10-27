"use client";

import { useRef, useEffect, useState } from "react";
import type { LandingOffer } from "@/lib/offers";
import OfferCard from "@/components/offer/offer-card";
import OfferDetail from "@/components/offer/offer-detail";

export default function OffersClient({ offers }: { offers: LandingOffer[] }) {
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const detailRef = useRef<HTMLDivElement>(null);

  const selected = offers.find((o) => o.id === selectedId) ?? null;

  // Scroll detail panel into view whenever a new offer is selected
  useEffect(() => {
    if (selectedId !== null) {
      detailRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedId]);

  function handleSelect(id: number) {
    setSelectedId((prev) => (prev === id ? null : id)); // toggle off if same card clicked
  }

  return (
    <>
      {/* ── Card grid ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {offers.map((offer) => (
          <div
            key={offer.id}
            onClick={() => handleSelect(offer.id)}
            className="cursor-pointer"
          >
            <OfferCard offer={offer} selected={selectedId === offer.id} />
          </div>
        ))}
      </div>

      {/* ── Inline detail panel ── */}
      {selected && (
        <div ref={detailRef} className="mt-10 overflow-hidden rounded-3xl shadow-2xl ring-1 ring-zinc-200 dark:ring-zinc-800">
          <OfferDetail
            offer={selected}
            isFirst
            onClose={() => setSelectedId(null)}
          />
        </div>
      )}
    </>
  );
}
