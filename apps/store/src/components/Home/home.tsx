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
import type { LandingOffer } from "@/lib/offers";

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

export default function BannerSlider({ offers = [] }: { offers?: LandingOffer[] }) {
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

        {/* PROMO BANNER SECTION (offers from DB) */}
        {offers.length > 0 && (
          <div className="mt-10 px-4 sm:px-8 mb-10 space-y-6">
            {offers.map((offer) => {
              const ctaHref = offer.ctaLink || "/collection";

              return (
                <div
                  key={offer.id}
                  className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-fuchsia-900 via-purple-900 to-fuchsia-950 border border-fuchsia-800/40"
                >
                  {/* Glow accents */}
                  <div className="absolute -top-10 -left-10 w-56 h-56 bg-fuchsia-500/20 rounded-full blur-3xl" />
                  <div className="absolute -bottom-10 -right-10 w-56 h-56 bg-purple-500/20 rounded-full blur-3xl" />

                  <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-6 p-8 sm:p-12">
                    <div className="text-center sm:text-left">
                      <span className="inline-block text-xs font-semibold tracking-wider text-fuchsia-300 bg-fuchsia-500/10 px-3 py-1 rounded-full mb-3">
                        {offer.badgeText || offer.subtitle || "LIMITED TIME OFFER"}
                      </span>
                      <h2 className="text-2xl sm:text-4xl font-bold text-white mb-2 leading-tight">
                        {offer.title}
                      </h2>
                      {offer.description && (
                        <p className="text-gray-300 text-sm sm:text-base max-w-md">
                          {offer.description}
                        </p>
                      )}
                      {offer.promoCode && (
                        <span className="inline-block mt-3 bg-white/95 text-fuchsia-600 px-3 py-1.5 rounded-xl font-bold text-sm border border-dashed border-fuchsia-400">
                          Use code: {offer.promoCode}
                        </span>
                      )}
                    </div>

                    <div className="flex flex-col items-center gap-3 shrink-0">
                      <OfferCta
                        href={ctaHref}
                        className="inline-flex items-center justify-center bg-fuchsia-500 hover:bg-fuchsia-600 text-white font-semibold transition-colors rounded-md h-11 px-8 text-sm"
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
              );
            })}
          </div>
        )}
      </Card>
    </>
  );
}