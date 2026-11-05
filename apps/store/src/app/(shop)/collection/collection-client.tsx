"use client";

import { useRef, useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@online-store/ui/button";
import {
  ArrowRight,
  Sparkles,
  Zap,
  Home,
  Gem,
  Dumbbell,
  Watch,
  Star,
  ShoppingBag,
  TrendingUp,
  BadgePercent,
  ChevronRight,
  Package,
  type LucideIcon,
} from "lucide-react";
import type { LandingOffer } from "@/lib/offers";

/* ────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────── */
export type CollectionIconKey =
  | "fashion"
  | "electronics"
  | "home"
  | "beauty"
  | "sports"
  | "accessories";

export type CollectionItem = {
  id?: number;
  title: string;
  subtitle: string;
  image: string | null;
  count: string;
  accent: string;
  icon: CollectionIconKey;
};

export type CollectionStatKey =
  | "products"
  | "rating"
  | "customers"
  | "discount";

export type CollectionStat = {
  key: CollectionStatKey;
  value: string;
  label: string;
};

const ICONS: Record<CollectionIconKey, LucideIcon> = {
  fashion: ShoppingBag,
  electronics: Zap,
  home: Home,
  beauty: Gem,
  sports: Dumbbell,
  accessories: Watch,
};

const STAT_ICONS: Record<CollectionStatKey, LucideIcon> = {
  products: Package,
  rating: Star,
  customers: TrendingUp,
  discount: BadgePercent,
};

/* ────────────────────────────────────────────────
   SCROLL REVEAL HOOK
──────────────────────────────────────────────── */
function useReveal(threshold = 0.12) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, visible };
}

/* ────────────────────────────────────────────────
   SECTION LABEL
──────────────────────────────────────────────── */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950 border border-fuchsia-200 dark:border-fuchsia-800 text-fuchsia-600 dark:text-fuchsia-400 text-xs font-semibold tracking-widest uppercase gm-font-body mb-5">
      <Sparkles size={11} />
      {children}
    </div>
  );
}

/* ────────────────────────────────────────────────
   COLLECTION CARD
──────────────────────────────────────────────── */
function CollectionCard({
  collection,
  delay,
}: {
  collection: CollectionItem;
  delay: number;
}) {
  const { ref, visible } = useReveal();
  const Icon = ICONS[collection.icon] ?? ShoppingBag;
  const image = collection.image;
  const href = collection.id
    ? `/products?categoryId=${collection.id}`
    : "/products";

  return (
    <div
      ref={ref}
      className="gm-card-hover"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(36px)",
        transition: `opacity 0.6s ${delay}ms cubic-bezier(0.22,1,0.36,1), transform 0.6s ${delay}ms cubic-bezier(0.22,1,0.36,1)`,
      }}
    >
      <div className="group relative overflow-hidden rounded-xl bg-white dark:bg-zinc-900 border border-fuchsia-100 dark:border-zinc-800 shadow-sm">

        {/* Image */}
        <div className="gm-img-zoom relative h-[280px] overflow-hidden">
          {image ? (
            <img
              src={image}
              alt={collection.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div
              className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${collection.accent}`}
            >
              <Icon size={56} className="text-white/80" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Count badge */}
          <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-white/15 backdrop-blur-md border border-white/20 text-white px-3 py-1.5 rounded-lg text-xs font-semibold gm-font-body">
            <Package size={10} />
            {collection.count} Products
          </div>

          {/* Icon badge */}
          <div className={`absolute top-4 right-4 w-9 h-9 rounded-lg bg-gradient-to-br ${collection.accent} flex items-center justify-center shadow-lg`}>
            <Icon size={16} className="text-white" />
          </div>
        </div>

        {/* Body */}
        <div className="p-6">
          <h3 className="gm-font-display text-xl font-bold text-gray-900 dark:text-white mb-1.5 group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400 transition-colors duration-200">
            {collection.title}
          </h3>
          <p className="gm-font-body text-sm text-gray-500 dark:text-gray-400 leading-relaxed mb-5">
            {collection.subtitle}
          </p>

          <Button
            asChild
            variant="outline"
            className="w-full flex items-center justify-between px-5 py-3 h-auto rounded-lg border-fuchsia-200 dark:border-fuchsia-900 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold gm-font-body hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 hover:border-fuchsia-400 dark:hover:border-fuchsia-700 transition-all duration-200 group/btn"
          >
            <Link href={href}>
              <span>Explore Collection</span>
              <ChevronRight size={15} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   STAT CARD
──────────────────────────────────────────────── */
function StatCard({ stat, delay }: { stat: CollectionStat; delay: number }) {
  const { ref, visible } = useReveal();
  const Icon = STAT_ICONS[stat.key] ?? Package;
  return (
    <div
      ref={ref}
      className="flex flex-col items-center gap-3 p-6 rounded-xl bg-white dark:bg-zinc-900 border border-fuchsia-100 dark:border-zinc-800 shadow-sm"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: `opacity 0.5s ${delay}ms ease, transform 0.5s ${delay}ms ease`,
      }}
    >
      <div className="w-11 h-11 rounded-lg bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center text-fuchsia-500 dark:text-fuchsia-400">
        <Icon size={20} />
      </div>
      <p className="gm-font-display text-2xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
      <p className="gm-font-body text-xs text-gray-400 dark:text-gray-500 tracking-wide uppercase font-medium">{stat.label}</p>
    </div>
  );
}

/* ────────────────────────────────────────────────
   PAGE COMPONENT
──────────────────────────────────────────────── */
export default function CollectionPage({
  collections,
  stats,
  offers,
}: {
  collections: CollectionItem[];
  stats: CollectionStat[];
  offers: LandingOffer[];
}) {
  const featuredOffer = offers[0] ?? null;
  const promoOffer = offers[1] ?? null;
  const categoryNames = collections.map((collection) => collection.title);
  const categorySummary =
    categoryNames.length > 0
      ? `${categoryNames.slice(0, 4).join(", ")}${
          categoryNames.length > 4 ? ", and more" : ""
        }`
      : "our latest arrivals";
  const heroReveal = useReveal(0.05);
  const featReveal = useReveal(0.08);
  const promoReveal = useReveal(0.08);

  return (
    <>

      <div className="min-h-screen bg-white dark:bg-zinc-950 text-zinc-900 dark:text-white gm-font-body overflow-x-hidden">

        {/* ══════════════════════════════════
            HERO
        ══════════════════════════════════ */}
        <section className="relative pt-28 pb-20 px-6 overflow-hidden">

          {/* Ambient glow */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-fuchsia-400/10 dark:bg-fuchsia-600/10 rounded-full blur-[120px]" />
            <div className="absolute bottom-0 right-0 w-80 h-80 bg-purple-400/10 dark:bg-purple-700/10 rounded-full blur-[80px]" />
          </div>

          {/* Floating decorative ring */}
          <div className="pointer-events-none absolute top-24 right-12 w-20 h-20 rounded-full border-2 border-dashed border-fuchsia-200 dark:border-fuchsia-900 gm-rotate opacity-60" />
          <div className="pointer-events-none absolute bottom-16 left-10 w-10 h-10 rounded-full border border-fuchsia-300 dark:border-fuchsia-800 gm-float opacity-40" />

          <div
            ref={heroReveal.ref}
            className="max-w-4xl mx-auto text-center relative z-10"
          >
            <div
              className="anim-fade-in"
              style={{ animationDelay: "0ms" }}
            >
              <SectionLabel>GrowMore Collections</SectionLabel>
            </div>

            <h1
              className="gm-font-display text-5xl md:text-7xl font-extrabold leading-[1.05] tracking-tight mb-6 anim-fade-up"
              style={{ animationDelay: "80ms" }}
            >
              Shop What{" "}
              <span className="gm-shimmer-text">Moves You</span>
            </h1>

            <p
              className="max-w-2xl mx-auto text-base md:text-lg text-gray-500 dark:text-gray-400 leading-relaxed mb-10 anim-fade-up"
              style={{ animationDelay: "160ms" }}
            >
              Premium categories — {categorySummary} — carefully curated so
              every purchase feels right.
            </p>

            <div
              className="flex flex-wrap justify-center gap-3 anim-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <Button
                asChild
                className="flex items-center gap-2 px-7 py-3.5 h-auto rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold gm-font-body shadow-lg shadow-fuchsia-300/30 dark:shadow-fuchsia-900/30 transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5"
              >
                <Link href="/products">
                  <ShoppingBag size={15} /> Shop Now
                </Link>
              </Button>
              <Button
                asChild
                variant="outline"
                className="flex items-center gap-2 px-7 py-3.5 h-auto rounded-lg border-fuchsia-200 dark:border-fuchsia-900 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold gm-font-body hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 transition-all duration-200"
              >
                <Link href="/products">
                  Browse Categories <ArrowRight size={14} />
                </Link>
              </Button>
            </div>
          </div>

          {/* Stat row */}
          {stats.length > 0 && (
            <div
              className="max-w-3xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 anim-fade-up"
              style={{ animationDelay: "320ms" }}
            >
              {stats.map((s, i) => (
                <StatCard key={s.label} stat={s} delay={i * 60} />
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════
            FEATURED BANNER
        ══════════════════════════════════ */}
        {featuredOffer && (
          <section className="max-w-7xl mx-auto px-6 pb-20">
            <div
              ref={featReveal.ref}
              style={{
                opacity: featReveal.visible ? 1 : 0,
                transform: featReveal.visible ? "scale(1)" : "scale(0.97)",
                transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              <div className="group relative overflow-hidden rounded-2xl border border-fuchsia-100 dark:border-fuchsia-900/40 shadow-2xl gm-img-zoom">
                {featuredOffer.image || featuredOffer.images[0] ? (
                  <img
                    src={featuredOffer.image || featuredOffer.images[0]}
                    alt={featuredOffer.title}
                    className="w-full h-[520px] md:h-[620px] object-cover"
                  />
                ) : (
                  <div className="w-full h-[520px] md:h-[620px] bg-gradient-to-br from-fuchsia-700 via-purple-700 to-zinc-950" />
                )}
                <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex items-center">
                  <div className="px-10 md:px-20 text-white max-w-xl">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-fuchsia-500 text-white text-xs font-bold tracking-widest uppercase mb-6 gm-font-body">
                      <Sparkles size={10} />{" "}
                      {featuredOffer.badgeText || "Featured"}
                    </div>
                    <h2 className="gm-font-display text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                      {featuredOffer.title}
                    </h2>
                    {(featuredOffer.subtitle || featuredOffer.description) && (
                      <p className="text-zinc-300 text-base leading-relaxed mb-8 gm-font-body line-clamp-3">
                        {featuredOffer.subtitle || featuredOffer.description}
                      </p>
                    )}
                    <div className="flex flex-wrap gap-3">
                      <Button
                        asChild
                        className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.03] gm-font-body"
                      >
                        <Link href={featuredOffer.ctaLink || "/products"}>
                          {featuredOffer.ctaText || "Shop Now"}{" "}
                          <ArrowRight size={14} />
                        </Link>
                      </Button>
                      <Button
                        asChild
                        variant="outline"
                        className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg border-white/30 bg-transparent text-white text-sm font-semibold hover:bg-white/10 hover:text-white transition-all duration-200 gm-font-body"
                      >
                        <Link href="/products">View Products</Link>
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Corner accent */}
                {featuredOffer.promoCode && (
                  <div className="absolute bottom-8 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm gm-font-body">
                    <Star
                      size={12}
                      className="fill-fuchsia-400 text-fuchsia-400"
                    />
                    <span className="font-semibold">
                      Use code {featuredOffer.promoCode}
                    </span>
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ══════════════════════════════════
            COLLECTION GRID
        ══════════════════════════════════ */}
        <section className="max-w-7xl mx-auto px-6 pb-24">

          {/* Section header */}
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <SectionLabel>Shop Collections</SectionLabel>
              <h2 className="gm-font-display text-4xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Popular Categories
              </h2>
              <p className="gm-font-body text-gray-500 dark:text-gray-400 mt-3 max-w-xl text-sm leading-relaxed">
                Browse our most-loved categories — each stocked with carefully selected products.
              </p>
            </div>
            <Button
              asChild
              variant="ghost"
              className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold gm-font-body hover:underline underline-offset-4 hover:bg-transparent transition-all"
            >
              <Link href="/products">
                View all <ChevronRight size={14} />
              </Link>
            </Button>
          </div>

          {/* Grid */}
          {collections.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-fuchsia-200 dark:border-zinc-800 py-20 text-center">
              <Package
                size={40}
                className="mb-3 text-fuchsia-400/60 dark:text-fuchsia-500/60"
              />
              <p className="gm-font-display text-lg font-semibold">
                No collections yet
              </p>
              <p className="gm-font-body mt-1 text-sm text-gray-500 dark:text-gray-400">
                Categories added from the admin panel will appear here.
              </p>
              <Button asChild variant="outline" className="mt-5">
                <Link href="/products">Browse all products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {collections.map((c, i) => (
                <CollectionCard key={c.title} collection={c} delay={i * 70} />
              ))}
            </div>
          )}
        </section>

        {/* ══════════════════════════════════
            PROMO BANNER
        ══════════════════════════════════ */}
        {promoOffer && (
          <section className="max-w-7xl mx-auto px-6 pb-24">
            <div
              ref={promoReveal.ref}
              className="relative overflow-hidden rounded-2xl bg-zinc-950 dark:bg-zinc-900 border border-zinc-800"
              style={{
                opacity: promoReveal.visible ? 1 : 0,
                transform: promoReveal.visible ? "translateY(0)" : "translateY(32px)",
                transition: "opacity 0.7s ease, transform 0.7s cubic-bezier(0.22,1,0.36,1)",
              }}
            >
              {/* BG glow */}
              <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute -top-20 -left-20 w-[500px] h-[400px] bg-fuchsia-600/20 rounded-full blur-[100px]" />
                <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-purple-600/20 rounded-full blur-[80px]" />
              </div>

              <div className="grid lg:grid-cols-2 gap-0 relative z-10">
                {/* Text side */}
                <div className="p-10 md:p-16 text-white flex flex-col justify-center">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border border-fuchsia-500/40 bg-fuchsia-500/10 text-fuchsia-400 text-xs font-bold tracking-widest uppercase mb-6 gm-font-body w-fit">
                    <BadgePercent size={11} />{" "}
                    {promoOffer.badgeText || "Limited Time Offer"}
                  </div>
                  <h2 className="gm-font-display text-4xl md:text-5xl font-extrabold leading-tight mb-5">
                    {promoOffer.title}
                  </h2>
                  {(promoOffer.subtitle || promoOffer.description) && (
                    <p className="gm-font-body text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm line-clamp-3">
                      {promoOffer.subtitle || promoOffer.description}
                    </p>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <Button
                      asChild
                      className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold gm-font-body transition-all duration-200 hover:scale-[1.03] shadow-lg shadow-fuchsia-900/40"
                    >
                      <Link href={promoOffer.ctaLink || "/products"}>
                        {promoOffer.ctaText || "Shop Now"}{" "}
                        <ArrowRight size={14} />
                      </Link>
                    </Button>
                    <Button
                      asChild
                      variant="outline"
                      className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg border-zinc-700 bg-transparent text-zinc-300 text-sm font-semibold gm-font-body hover:border-fuchsia-700 hover:text-fuchsia-400 transition-all duration-200"
                    >
                      <Link href="/offers">Discover Deals</Link>
                    </Button>
                  </div>
                </div>

                {/* Image side */}
                <div className="relative h-[400px] lg:h-auto overflow-hidden">
                  {promoOffer.image || promoOffer.images[0] ? (
                    <img
                      src={promoOffer.image || promoOffer.images[0]}
                      alt={promoOffer.title}
                      className="w-full h-full object-cover opacity-80"
                    />
                  ) : (
                    <div className="h-full w-full bg-gradient-to-br from-fuchsia-700 via-purple-700 to-zinc-950" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-l from-transparent to-zinc-950/50 lg:to-transparent" />
                </div>
              </div>
            </div>
          </section>
        )}


      </div>
    </>
  );
}