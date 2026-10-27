"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ChevronLeft, ChevronRight, Tag } from "lucide-react";
import Link from "next/link";
import { formatLKR } from "@/lib/utils";
import type { LandingOffer, LandingOfferProduct } from "@/lib/offers";

const HOME_OFFER_LIMIT = 4;
const AUTO_SLIDE_MS = 5000;

const navBtn =
  "absolute top-1/2 z-20 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60";

function OfferProductCard({ product }: { product: LandingOfferProduct }) {
  const { sellingPrice, discountPercent } = product;
  const price =
    sellingPrice != null && discountPercent
      ? sellingPrice * (1 - discountPercent / 100)
      : sellingPrice;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-xl border border-zinc-200 bg-white text-zinc-900 shadow-sm transition hover:-translate-y-1 hover:shadow-md dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100 dark:bg-zinc-800">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-fuchsia-100 to-amber-100 dark:from-fuchsia-950 dark:to-amber-950" />
        )}
        {discountPercent ? (
          <span className="absolute left-2 top-2 rounded-md bg-red-600 px-1.5 py-0.5 text-[10px] font-bold text-white">
            -{discountPercent}%
          </span>
        ) : null}
      </div>
      <div className="space-y-0.5 p-2 text-center">
        <h4 className="line-clamp-1 text-xs font-semibold">{product.name}</h4>
        {price != null && (
          <p className="text-xs">
            <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">
              {formatLKR(price)}
            </span>
            {discountPercent && sellingPrice != null && (
              <span className="ml-1 text-[10px] text-zinc-400 line-through">
                {formatLKR(sellingPrice)}
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function OfferDialog({ offers }: { offers: LandingOffer[] }) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false); // hides the small card
  const [current, setCurrent] = useState(0);
  const count = offers.length;

  // Open shortly after mount
  useEffect(() => {
    if (!count) return;
    const t = setTimeout(() => setOpen(true), 800);
    return () => clearTimeout(t);
  }, [count]);

  // Auto-advance (restarts on every change, so manual nav resets it)
  useEffect(() => {
    if (!open || count <= 1) return;
    const t = setTimeout(() => setCurrent((p) => (p + 1) % count), AUTO_SLIDE_MS);
    return () => clearTimeout(t);
  }, [open, current, count]);

  // Escape to close + lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [open]);

  if (!count) return null;

  const offer = offers[current];
  const bg = offer.image || offer.images[0] || null;
  const ctaHref = offer.ctaLink || "/offers";
  const isExternal = ctaHref.startsWith("http");
  const go = (i: number) => setCurrent((i + count) % count);

  const ctaClass =
    "ml-auto inline-flex h-9 items-center justify-center rounded-lg bg-fuchsia-500 px-6 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-600";

  return (
    <>
      {/* ── Full dialog ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="offer-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          >
            <motion.div
              role="dialog"
              aria-modal="true"
              aria-label="Special offers"
              initial={{ opacity: 0, scale: 0.92, y: 30 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.92, y: 30 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              onClick={(e) => e.stopPropagation()}
              className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/5 dark:bg-zinc-950 dark:ring-white/10"
            >
              {/* Header */}
              <div
                className={`relative min-h-44 flex-shrink-0 overflow-hidden ${
                  bg ? "" : "bg-gradient-to-r from-fuchsia-900 via-purple-900 to-fuchsia-950"
                }`}
              >
                {bg ? (
                  <>
                    <img src={bg} alt="" aria-hidden className="absolute inset-0 h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70" />
                  </>
                ) : (
                  <>
                    <div className="absolute -left-10 -top-10 h-48 w-48 rounded-full bg-fuchsia-500/20 blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 h-48 w-48 rounded-full bg-purple-500/20 blur-3xl" />
                  </>
                )}

                {/* z-20 so the text block below can't cover it */}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  aria-label="Close offer"
                  className="absolute right-3 top-3 z-20 flex h-8 w-8 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm transition hover:bg-black/60"
                >
                  <X className="h-4 w-4" />
                </button>

                {count > 1 && (
                  <>
                    <button type="button" onClick={() => go(current - 1)} aria-label="Previous offer" className={`${navBtn} left-3`}>
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button type="button" onClick={() => go(current + 1)} aria-label="Next offer" className={`${navBtn} right-3`}>
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    <div className="absolute bottom-3 left-1/2 z-20 flex -translate-x-1/2 gap-1.5">
                      {offers.map((o, i) => (
                        <button
                          type="button"
                          key={o.id}
                          onClick={() => go(i)}
                          aria-label={`Go to offer ${i + 1}`}
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            i === current ? "w-5 bg-fuchsia-400" : "w-1.5 bg-white/50"
                          }`}
                        />
                      ))}
                    </div>
                  </>
                )}

                <div className="relative z-10 px-12 pb-10 pt-6 text-center sm:text-left">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={offer.id}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.25 }}
                    >
                      <span className="mb-2 inline-block rounded-full bg-fuchsia-500/20 px-3 py-0.5 text-xs font-semibold tracking-wider text-fuchsia-300">
                        {offer.badgeText || offer.subtitle || "LIMITED TIME OFFER"}
                      </span>
                      <h3 className="text-xl font-black leading-tight text-white sm:text-2xl">{offer.title}</h3>
                      {offer.description && (
                        <p className="mt-1 line-clamp-2 text-sm text-gray-300">{offer.description}</p>
                      )}
                      {offer.promoCode && (
                        <span className="mt-2 inline-flex items-center gap-1.5 rounded-lg border border-dashed border-fuchsia-400 bg-white/95 px-3 py-1 text-sm font-bold text-fuchsia-600">
                          <Tag className="h-3.5 w-3.5" />
                          {offer.promoCode}
                        </span>
                      )}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Products */}
              <div className="flex-1 overflow-y-auto p-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={offer.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    {offer.products.length ? (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        {offer.products.slice(0, HOME_OFFER_LIMIT).map((p) => (
                          <OfferProductCard key={p.id} product={p} />
                        ))}
                      </div>
                    ) : (
                      <p className="py-6 text-center text-sm text-zinc-400">No products listed.</p>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Footer */}
              <div className="flex flex-shrink-0 items-center border-t border-zinc-200 px-4 py-3 dark:border-zinc-800">
                {offer.endsAt && (
                  <span className="text-xs text-zinc-500 dark:text-zinc-400">
                    Ends {new Date(offer.endsAt).toLocaleDateString()}
                  </span>
                )}
                {isExternal ? (
                  <a href={ctaHref} target="_blank" rel="noopener noreferrer" className={ctaClass}>
                    {offer.ctaText || "Shop Now"}
                  </a>
                ) : (
                  <Link href={ctaHref} className={ctaClass}>
                    {offer.ctaText || "Shop Now"}
                  </Link>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Small offer card (stays visible while scrolling) ── */}
      <AnimatePresence>
        {!open && !dismissed && (
          <motion.div
            key="mini-card"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-4 right-4 z-50 w-[calc(100%-2rem)] max-w-[16rem] overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
          >
            <button
              type="button"
              onClick={() => setOpen(true)}
              aria-label="View offers"
              className="flex w-full items-center gap-3 p-2 pr-8 text-left transition hover:bg-zinc-50 dark:hover:bg-zinc-800"
            >
              <span className="relative flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-fuchsia-500 to-purple-700 text-white">
                {bg ? (
                  <img src={bg} alt="" className="h-full w-full object-cover" />
                ) : (
                  <Tag className="h-5 w-5" />
                )}
              </span>
              <span className="min-w-0">
                <span className="block truncate text-[10px] font-semibold uppercase tracking-wider text-fuchsia-600 dark:text-fuchsia-400">
                  {offer.badgeText || "Special offer"}
                  {count > 1 && ` · ${count}`}
                </span>
                <span className="block truncate text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                  {offer.title}
                </span>
              </span>
            </button>
            <button
              type="button"
              onClick={() => setDismissed(true)}
              aria-label="Dismiss offers"
              className="absolute right-1.5 top-1.5 flex h-5 w-5 items-center justify-center rounded-full text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-700 dark:hover:bg-zinc-800 dark:hover:text-zinc-200"
            >
              <X className="h-3 w-3" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}