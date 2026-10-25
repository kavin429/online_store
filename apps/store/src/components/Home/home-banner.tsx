"use client";

import React, { useEffect, useState, Suspense, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent } from "@online-store/ui/card";
import ProductCard from "@/components/Home/product";
import CategoriesSliderPage from "@/components/Home/category";
import { Button } from "@online-store/ui/button";
import { useSearchParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { PartyPopper } from "lucide-react";
import Link from "next/link";
import { formatLKR } from "@/lib/utils";
import type { LandingOffer, LandingOfferProduct } from "@/lib/offers";

function LoginToast() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { data: session, status } = useSession();
  const hasShown = useRef(false);

  useEffect(() => {
    if (
      !hasShown.current &&
      searchParams.get("loggedIn") === "1" &&
      status === "authenticated" &&
      session?.user
    ) {
      hasShown.current = true;
      toast.success(`Welcome, ${session.user.name}!`, {
        icon: <PartyPopper className="h-5 w-5 text-fuchsia-500" />,
      });
      router.replace("/");
    }
  }, [searchParams, session, status, router]);

  return null;
}

const slides = [
  {
    title: "Discover Amazing Products for Every Lifestyle",
    description:
      "Shop the latest collections with quality products, great prices, and fast delivery — all in one place.",
    button: "Explore Our Collection",
    image: "/banner1.png",
  },
  {
    title: "Upgrade Your Style with Trending Fashion",
    description:
      "Find premium fashion, accessories, and everyday essentials for modern living.",
    button: "Shop Fashion",
    image: "/banner2.png",
  },
  {
    title: "Modern Electronics for Smart Living",
    description:
      "Browse the newest gadgets, smart devices, and tech products at unbeatable prices.",
    button: "View Electronics",
    image: "/shoe1.png",
  },
];

const HOME_OFFER_LIMIT = 8;

function OfferCta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  if (href.startsWith("http")) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
        {children}
      </a>
    );
  }
  return (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function OfferProductCard({ product }: { product: LandingOfferProduct }) {
  const price =
    product.sellingPrice == null
      ? null
      : product.discountPercent
        ? product.sellingPrice * (1 - product.discountPercent / 100)
        : product.sellingPrice;

  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-zinc-100 bg-white text-zinc-900 shadow-sm transition-transform hover:-translate-y-1 hover:shadow-xl"
    >
      <div className="relative aspect-square overflow-hidden bg-zinc-100">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
          />
        ) : (
          <div className="h-full w-full bg-gradient-to-br from-fuchsia-100 to-amber-100" />
        )}
        {product.discountPercent ? (
          <span className="absolute left-3 top-3 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-4 text-center">
        <h4 className="line-clamp-1 text-sm font-semibold">{product.name}</h4>
        {price != null && (
          <p className="text-sm">
            <span className="font-bold text-fuchsia-600">{formatLKR(price)}</span>
            {product.discountPercent && product.sellingPrice != null ? (
              <span className="ml-2 text-xs text-zinc-400 line-through">
                {formatLKR(product.sellingPrice)}
              </span>
            ) : null}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function HomeBanner({ offers = [] }: { offers?: LandingOffer[] }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <Suspense fallback={null}>
        <LoginToast />
      </Suspense>
      <Card
        className="w-full overflow-hidden"
        style={{ border: "none", boxShadow: "none", borderRadius: "0" }}
      >
        <CardContent className="p-0 min-h-[500px] flex flex-col sm:flex-row items-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, x: -100 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 100 }}
              transition={{ duration: 0.7 }}
              className="w-full flex flex-col sm:flex-row items-center"
            >
              {/* TEXT SECTION */}
              <div
                className="
    w-full sm:w-1/2
    flex flex-col justify-center items-start
    p-6 sm:p-8 sm:pl-16
    text-center sm:text-left
    mt-10 sm:mt-0
  "
              >
                <h1 className="text-3xl sm:text-5xl font-bold mb-4 leading-tight">
                  {slides[current].title}
                </h1>

                <p className="mb-6 text-base sm:text-lg text-gray-600 dark:text-gray-300">
                  {slides[current].description}
                </p>

                <Button variant="shoe" className="self-center sm:self-start">
                  {slides[current].button}
                </Button>
              </div>

              {/* IMAGE SECTION */}
              <div
                className="
                  relative
                  w-full sm:w-1/2
                  h-[300px] sm:h-[500px]
                  flex items-center justify-center
                  mt-7
                "
              >
                {/* Background Glow */}
                <motion.div
                  animate={{
                    scale: [1, 1.1, 1],
                    rotate: [0, 5, -5, 0],
                  }}
                  transition={{
                    duration: 6,
                    repeat: Infinity,
                  }}
                  className="absolute w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full bg-fuchsia-200/40 blur-3xl"
                />

                {/* Product Image */}
                <motion.img
                  key={slides[current].image}
                  src={slides[current].image}
                  alt="Banner Product"
                  initial={{ opacity: 0, scale: 0.8, rotate: -10 }}
                  animate={{ opacity: 1, scale: 1, rotate: 0 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.8 }}
                  className="relative z-10 w-[250px] sm:w-[420px] object-contain drop-shadow-2xl"
                />

                {/* Animated Rings */}
                <svg
                  viewBox="0 0 500 500"
                  className="absolute w-full h-full"
                >
                  <motion.circle
                    cx="250"
                    cy="250"
                    r="170"
                    stroke="#FFA500"
                    strokeWidth="4"
                    fill="transparent"
                    strokeDasharray="15 10"
                    animate={{ rotate: 360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 20,
                      ease: "linear",
                    }}
                    style={{ transformOrigin: "center" }}
                  />

                  <motion.circle
                    cx="250"
                    cy="250"
                    r="200"
                    stroke="#FF6347"
                    strokeWidth="3"
                    fill="transparent"
                    strokeDasharray="10 10"
                    animate={{ rotate: -360 }}
                    transition={{
                      repeat: Infinity,
                      duration: 25,
                      ease: "linear",
                    }}
                    style={{ transformOrigin: "center" }}
                  />
                </svg>
              </div>
            </motion.div>
          </AnimatePresence>
        </CardContent>

        {/* SLIDER DOTS */}
        <div className="flex justify-center gap-3">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrent(index)}
              className={`h-3 rounded-full transition-all duration-300 ${current === index
                ? "w-8 bg-fuchsia-500"
                : "w-3 bg-gray-300"
                }`}
            />
          ))}
        </div>

        <CategoriesSliderPage />

        <div className="mt-10">
          <ProductCard />
        </div>

        {/* FESTIVAL / OFFER SECTION */}
        {offers.length > 0 && (
          <section className="mt-14 mb-14 space-y-12 px-4 sm:px-8">
            <div className="text-center">
              <p className="text-sm font-bold uppercase tracking-[0.3em] text-fuchsia-500">
                Limited Time
              </p>
              <h2 className="mt-2 text-3xl font-black sm:text-4xl">Festival Offers</h2>
            </div>

            {offers.map((offer) => {
              const ctaHref = offer.ctaLink || `/offers`;
              const shown = offer.products.slice(0, HOME_OFFER_LIMIT);
              const hasMore = offer.products.length > HOME_OFFER_LIMIT;

              return (
                <div key={offer.id} className="space-y-6">
                  {/* Banner */}
                  <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-fuchsia-900 via-purple-900 to-fuchsia-950 border border-fuchsia-800/40">
                    <div className="absolute -top-10 -left-10 h-56 w-56 rounded-full bg-fuchsia-500/20 blur-3xl" />
                    <div className="absolute -bottom-10 -right-10 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl" />

                    <div className="relative z-10 flex flex-col items-center justify-between gap-6 p-8 sm:flex-row sm:p-12">
                      <div className="text-center sm:text-left">
                        <span className="mb-3 inline-block rounded-full bg-fuchsia-500/10 px-3 py-1 text-xs font-semibold tracking-wider text-fuchsia-300">
                          {offer.badgeText || offer.subtitle || "LIMITED TIME OFFER"}
                        </span>
                        <h3 className="mb-2 text-2xl font-bold leading-tight text-white sm:text-4xl">
                          {offer.title}
                        </h3>
                        {offer.description && (
                          <p className="max-w-md text-sm text-gray-300 sm:text-base">
                            {offer.description}
                          </p>
                        )}
                        {offer.promoCode && (
                          <span className="mt-3 inline-block rounded-xl border border-dashed border-fuchsia-400 bg-white/95 px-3 py-1.5 text-sm font-bold text-fuchsia-600">
                            Use code: {offer.promoCode}
                          </span>
                        )}
                      </div>

                      <div className="flex shrink-0 flex-col items-center gap-3">
                        <OfferCta
                          href={ctaHref}
                          className="inline-flex h-11 items-center justify-center rounded-md bg-fuchsia-500 px-8 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-600"
                        >
                          {offer.ctaText || "Shop Now"}
                        </OfferCta>
                        {offer.endsAt && (
                          <span className="text-xs text-gray-400">
                            Ends {new Date(offer.endsAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Offer products */}
                  {offer.products.length > 0 && (
                    <div className="space-y-6">
                      {offer.products.length <= HOME_OFFER_LIMIT ? (
                        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                          {shown.map((p) => (
                            <OfferProductCard key={p.id} product={p} />
                          ))}
                        </div>
                      ) : (
                        <div className="relative">
                          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                            {shown.map((p) => (
                              <OfferProductCard key={p.id} product={p} />
                            ))}
                          </div>
                          <div className="pointer-events-none absolute inset-x-0 bottom-0 flex h-32 items-end justify-center bg-gradient-to-t from-white to-transparent">
                            <OfferCta
                              href={`/collection?offer=${offer.id}`}
                              className="pointer-events-auto mb-1 inline-flex h-11 items-center rounded-md bg-zinc-900 px-8 text-sm font-semibold text-white transition-colors hover:bg-fuchsia-600"
                            >
                              View all {offer.products.length} products
                            </OfferCta>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </section>
        )}
      </Card>
    </>
  );
}