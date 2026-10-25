"use client";

import { useRef, useEffect, useState } from "react";
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
  Send,
  Package,
  Leaf,
  CheckCircle2,
} from "lucide-react";

/* ────────────────────────────────────────────────
   DATA
──────────────────────────────────────────────── */
const collections = [
  {
    title: "Fashion",
    subtitle: "Trending styles for the modern wardrobe",
    image: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=900&auto=format&fit=crop",
    count: "120+",
    icon: ShoppingBag,
    accent: "from-fuchsia-500 to-pink-500",
  },
  {
    title: "Electronics",
    subtitle: "Smart gadgets and premium technology",
    image: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=900&auto=format&fit=crop",
    count: "95+",
    icon: Zap,
    accent: "from-violet-500 to-fuchsia-500",
  },
  {
    title: "Home Living",
    subtitle: "Beautiful products for your space",
    image: "https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?q=80&w=900&auto=format&fit=crop",
    count: "80+",
    icon: Home,
    accent: "from-fuchsia-400 to-purple-500",
  },
  {
    title: "Beauty & Care",
    subtitle: "Premium skincare and wellness",
    image: "https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?q=80&w=900&auto=format&fit=crop",
    count: "60+",
    icon: Gem,
    accent: "from-pink-500 to-fuchsia-600",
  },
  {
    title: "Sports & Fitness",
    subtitle: "Gear for an active lifestyle",
    image: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=900&auto=format&fit=crop",
    count: "70+",
    icon: Dumbbell,
    accent: "from-fuchsia-600 to-violet-600",
  },
  {
    title: "Accessories",
    subtitle: "Curated essentials to complete any look",
    image: "https://images.unsplash.com/photo-1523170335258-f5ed11844a49?q=80&w=900&auto=format&fit=crop",
    count: "110+",
    icon: Watch,
    accent: "from-purple-500 to-fuchsia-500",
  },
];

const stats = [
  { icon: Package,     value: "500+",   label: "Products" },
  { icon: Star,        value: "4.9",    label: "Avg Rating" },
  { icon: TrendingUp,  value: "50K+",   label: "Happy Customers" },
  { icon: BadgePercent,value: "Up 70%", label: "Off This Week" },
];

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
  }, []);
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
  collection: (typeof collections)[0];
  delay: number;
}) {
  const { ref, visible } = useReveal();
  const Icon = collection.icon;

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
          <img
            src={collection.image}
            alt={collection.title}
            className="w-full h-full object-cover"
          />
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
            variant="outline"
            className="w-full flex items-center justify-between px-5 py-3 h-auto rounded-lg border-fuchsia-200 dark:border-fuchsia-900 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold gm-font-body hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 hover:border-fuchsia-400 dark:hover:border-fuchsia-700 transition-all duration-200 group/btn"
          >
            <span>Explore Collection</span>
            <ChevronRight size={15} className="group-hover/btn:translate-x-1 transition-transform duration-200" />
          </Button>
        </div>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────
   STAT CARD
──────────────────────────────────────────────── */
function StatCard({ stat, delay }: { stat: (typeof stats)[0]; delay: number }) {
  const { ref, visible } = useReveal();
  const Icon = stat.icon;
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
export default function CollectionPage() {
  const [email, setEmail]         = useState("");
  const [subscribed, setSubscribed] = useState(false);
  const heroReveal   = useReveal(0.05);
  const featReveal   = useReveal(0.08);
  const promoReveal  = useReveal(0.08);
  const newsReveal   = useReveal(0.08);

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
              Premium categories — fashion, electronics, beauty, and home — carefully curated so every purchase feels right.
            </p>

            <div
              className="flex flex-wrap justify-center gap-3 anim-fade-up"
              style={{ animationDelay: "240ms" }}
            >
              <Button className="flex items-center gap-2 px-7 py-3.5 h-auto rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold gm-font-body shadow-lg shadow-fuchsia-300/30 dark:shadow-fuchsia-900/30 transition-all duration-200 hover:scale-[1.03] hover:-translate-y-0.5">
                <ShoppingBag size={15} /> Shop Now
              </Button>
              <Button
                variant="outline"
                className="flex items-center gap-2 px-7 py-3.5 h-auto rounded-lg border-fuchsia-200 dark:border-fuchsia-900 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold gm-font-body hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950 transition-all duration-200"
              >
                Browse Categories <ArrowRight size={14} />
              </Button>
            </div>
          </div>

          {/* Stat row */}
          <div
            className="max-w-3xl mx-auto mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 anim-fade-up"
            style={{ animationDelay: "320ms" }}
          >
            {stats.map((s, i) => (
              <StatCard key={s.label} stat={s} delay={i * 60} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            FEATURED BANNER
        ══════════════════════════════════ */}
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
              <img
                src="https://images.unsplash.com/photo-1483985988355-763728e1935b?q=80&w=1400&auto=format&fit=crop"
                alt="Summer 2026 Collection"
                className="w-full h-[520px] md:h-[620px] object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/35 to-transparent" />

              {/* Content */}
              <div className="absolute inset-0 flex items-center">
                <div className="px-10 md:px-20 text-white max-w-xl">
                  <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-fuchsia-500 text-white text-xs font-bold tracking-widest uppercase mb-6 gm-font-body">
                    <Sparkles size={10} /> New Arrivals
                  </div>
                  <h2 className="gm-font-display text-4xl md:text-6xl font-extrabold leading-tight mb-4">
                    Summer 2026<br />Collection
                  </h2>
                  <p className="text-zinc-300 text-base leading-relaxed mb-8 gm-font-body">
                    Trendsetting fashion, accessories, and lifestyle products curated for your everyday style journey.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Button className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold transition-all duration-200 hover:scale-[1.03] gm-font-body">
                      Discover More <ArrowRight size={14} />
                    </Button>
                    <Button
                      variant="outline"
                      className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg border-white/30 bg-transparent text-white text-sm font-semibold hover:bg-white/10 hover:text-white transition-all duration-200 gm-font-body"
                    >
                      View Products
                    </Button>
                  </div>
                </div>
              </div>

              {/* Corner accent */}
              <div className="absolute bottom-8 right-8 flex items-center gap-2 bg-white/10 backdrop-blur-md border border-white/20 text-white px-4 py-2 rounded-lg text-sm gm-font-body">
                <Star size={12} className="fill-fuchsia-400 text-fuchsia-400" />
                <span className="font-semibold">Trending this season</span>
              </div>
            </div>
          </div>
        </section>

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
              variant="ghost"
              className="flex items-center gap-2 text-fuchsia-600 dark:text-fuchsia-400 text-sm font-semibold gm-font-body hover:underline underline-offset-4 hover:bg-transparent transition-all"
            >
              View all <ChevronRight size={14} />
            </Button>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
            {collections.map((c, i) => (
              <CollectionCard key={c.title} collection={c} delay={i * 70} />
            ))}
          </div>
        </section>

        {/* ══════════════════════════════════
            PROMO BANNER
        ══════════════════════════════════ */}
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
                  <BadgePercent size={11} /> Limited Time Offer
                </div>
                <h2 className="gm-font-display text-4xl md:text-5xl font-extrabold leading-tight mb-5">
                  Up to{" "}
                  <span className="gm-shimmer-text">70% off</span>
                  <br />Selected Items
                </h2>
                <p className="gm-font-body text-zinc-400 text-sm leading-relaxed mb-8 max-w-sm">
                  Fashion, electronics, accessories, and home essentials — all at exclusive prices this week only.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg bg-fuchsia-600 hover:bg-fuchsia-700 text-white text-sm font-semibold gm-font-body transition-all duration-200 hover:scale-[1.03] shadow-lg shadow-fuchsia-900/40">
                    Shop Sale <ArrowRight size={14} />
                  </Button>
                  <Button
                    variant="outline"
                    className="flex items-center gap-2 px-6 py-3 h-auto rounded-lg border-zinc-700 bg-transparent text-zinc-300 text-sm font-semibold gm-font-body hover:border-fuchsia-700 hover:text-fuchsia-400 transition-all duration-200"
                  >
                    Discover Deals
                  </Button>
                </div>
              </div>

              {/* Image side */}
              <div className="relative h-[400px] lg:h-auto overflow-hidden">
                <img
                  src="https://images.unsplash.com/photo-1523381210434-271e8be1f52b?q=80&w=900&auto=format&fit=crop"
                  alt="Sale Collection"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-l from-transparent to-zinc-950/50 lg:to-transparent" />
              </div>
            </div>
          </div>
        </section>


      </div>
    </>
  );
}