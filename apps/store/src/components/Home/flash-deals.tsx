"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, ShoppingCart, Flame, ArrowRight } from "lucide-react";
import Link from "next/link";

type Deal = {
  id: string | number;
  name: string;
  image: string;
  price: number;
  originalPrice: number;
  /** percentage of stock already claimed (0-100) */
  claimed?: number;
  href?: string;
};

// Replace with real data (e.g. pass `deals` from the server).
const sampleDeals: Deal[] = [
  { id: 1, name: "Air Run Sneakers", image: "/shoe1.png", price: 2499, originalPrice: 4999, claimed: 72 },
  { id: 2, name: "Urban Street Shoes", image: "/banner1.png", price: 1799, originalPrice: 2999, claimed: 45 },
  { id: 3, name: "Classic Fashion Pack", image: "/banner2.png", price: 999, originalPrice: 1999, claimed: 88 },
  { id: 4, name: "Sport Pro Edition", image: "/shoe1.png", price: 3299, originalPrice: 5499, claimed: 30 },
];

function useCountdown(endsAt?: string | number | Date) {
  const [left, setLeft] = useState<number | null>(null);

  useEffect(() => {
    const target = endsAt
      ? new Date(endsAt).getTime()
      : (() => {
          const d = new Date();
          d.setHours(24, 0, 0, 0); // next local midnight
          return d.getTime();
        })();

    const tick = () => setLeft(Math.max(0, target - Date.now()));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt]);

  if (left === null) return null; // avoids hydration mismatch
  const total = Math.floor(left / 1000);
  return {
    expired: left === 0,
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

function TimeBox({ value, label }: { value: number; label: string }) {
  const text = String(value).padStart(2, "0");
  return (
    <div className="flex flex-col items-center">
      <div className="relative flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white text-xl font-black text-fuchsia-700 shadow-md shadow-fuchsia-900/20 sm:h-14 sm:w-14 sm:text-2xl dark:bg-zinc-900 dark:text-fuchsia-300">
        <AnimatePresence mode="popLayout" initial={false}>
          <motion.span
            key={text}
            initial={{ y: -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 16, opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="tabular-nums"
          >
            {text}
          </motion.span>
        </AnimatePresence>
      </div>
      <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-fuchsia-100">
        {label}
      </span>
    </div>
  );
}

export default function FlashDeals({
  deals = sampleDeals,
  endsAt,
  viewAllHref = "/products",
}: {
  deals?: Deal[];
  endsAt?: string | number | Date;
  viewAllHref?: string;
}) {
  const time = useCountdown(endsAt);

  if (time?.expired || deals.length === 0) return null;

  return (
    <section className="px-4 py-10 sm:px-8 lg:px-16">
      <div className="mx-auto max-w-7xl">
        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-700 via-fuchsia-600 to-purple-600 p-6 shadow-xl shadow-fuchsia-500/20 sm:p-8">
          <div className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 rounded-full bg-white/15 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-16 left-1/3 h-48 w-48 rounded-full bg-amber-300/20 blur-3xl" />

          <div className="relative flex flex-col items-center justify-between gap-6 text-center md:flex-row md:text-left">
            <div>
              <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold uppercase tracking-wide text-white backdrop-blur">
                <Zap className="h-3.5 w-3.5 fill-amber-300 text-amber-300" />
                Limited time
              </span>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                Flash Deals
              </h2>
              <p className="mt-1 text-sm text-fuchsia-100">
                Grab them before the timer runs out.
              </p>
            </div>

            <div className="flex items-start gap-2 sm:gap-3" aria-live="off">
              {time ? (
                <>
                  <TimeBox value={time.hours} label="Hours" />
                  <span className="mt-3 text-2xl font-black text-white/80">:</span>
                  <TimeBox value={time.minutes} label="Mins" />
                  <span className="mt-3 text-2xl font-black text-white/80">:</span>
                  <TimeBox value={time.seconds} label="Secs" />
                </>
              ) : (
                <div className="h-[72px] w-[216px]" />
              )}
            </div>
          </div>
        </div>

        {/* Deals grid */}
        <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">
          {deals.map((deal, index) => {
            const discount = Math.round(
              ((deal.originalPrice - deal.price) / deal.originalPrice) * 100
            );
            const claimed = deal.claimed ?? 0;
            const almostGone = claimed >= 80;

            return (
              <motion.div
                key={deal.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-2xl border border-fuchsia-100 bg-white p-3 shadow-sm transition hover:-translate-y-1 hover:shadow-xl hover:shadow-fuchsia-500/15 dark:border-white/10 dark:bg-zinc-900 sm:p-4"
              >
                {/* Discount badge */}
                <span className="absolute left-3 top-3 z-10 rounded-full bg-gradient-to-r from-fuchsia-600 to-pink-500 px-2.5 py-1 text-xs font-bold text-white shadow-md shadow-fuchsia-500/30 sm:left-4 sm:top-4">
                  -{discount}%
                </span>

                {/* Image */}
                <div className="relative flex aspect-square items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-50 to-amber-50 dark:from-zinc-800 dark:to-zinc-800/60">
                  <div className="absolute h-2/3 w-2/3 rounded-full bg-fuchsia-300/30 blur-2xl dark:bg-fuchsia-600/20" />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={deal.image}
                    alt={deal.name}
                    loading="lazy"
                    className="relative z-10 h-4/5 w-4/5 object-contain drop-shadow-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-3"
                  />
                </div>

                {/* Info */}
                <div className="mt-3">
                  <h3 className="line-clamp-1 text-sm font-bold text-zinc-900 dark:text-zinc-50 sm:text-base">
                    {deal.name}
                  </h3>

                  <div className="mt-1 flex items-baseline gap-2">
                    <span className="text-lg font-black text-fuchsia-600 dark:text-fuchsia-400">
                      ₹{deal.price.toLocaleString("en-IN")}
                    </span>
                    <span className="text-xs text-zinc-400 line-through sm:text-sm">
                      ₹{deal.originalPrice.toLocaleString("en-IN")}
                    </span>
                  </div>

                  {/* Stock progress */}
                  <div className="mt-3">
                    <div className="h-2 w-full overflow-hidden rounded-full bg-fuchsia-100 dark:bg-white/10">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${claimed}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.9, delay: 0.2 + index * 0.08 }}
                        className="h-full rounded-full bg-gradient-to-r from-fuchsia-500 to-pink-500"
                      />
                    </div>
                    <p
                      className={`mt-1.5 flex items-center gap-1 text-xs font-medium ${
                        almostGone
                          ? "text-rose-600 dark:text-rose-400"
                          : "text-zinc-500 dark:text-zinc-400"
                      }`}
                    >
                      {almostGone && <Flame className="h-3.5 w-3.5" />}
                      {almostGone ? "Almost gone!" : `${claimed}% claimed`}
                    </p>
                  </div>

                  <button
                    type="button"
                    className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-fuchsia-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-md shadow-fuchsia-500/25 transition hover:from-fuchsia-500 hover:to-purple-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-zinc-900"
                  >
                    <ShoppingCart className="h-4 w-4" />
                    Add to cart
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* View all */}
        <div className="mt-8 flex justify-center">
          <Link
            href={viewAllHref}
            className="group inline-flex items-center gap-2 rounded-xl border border-fuchsia-200 bg-white px-6 py-3 text-sm font-semibold text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-white/10 dark:bg-white/5 dark:text-fuchsia-300 dark:hover:bg-white/10"
          >
            View all deals
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}