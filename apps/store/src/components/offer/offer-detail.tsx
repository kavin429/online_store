import Link from "next/link";
import { ArrowLeft, ShoppingBag } from "lucide-react";
import { formatLKR } from "@/lib/utils";
import type { LandingOffer, LandingOfferProduct } from "@/lib/offers";
import OfferCountdown from "@/components/offer/offer-countdown";
import ClaimOfferButton from "@/components/offer/claim-offer-button";

const MAX_INLINE_PRODUCTS = 8;

const finalPrice = ({ sellingPrice, discountPercent }: LandingOfferProduct) =>
  sellingPrice != null && discountPercent
    ? sellingPrice * (1 - discountPercent / 100)
    : sellingPrice;

function OfferCta({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) {
  return href.startsWith("http") ? (
    <a href={href} target="_blank" rel="noopener noreferrer" className={className}>
      {children}
    </a>
  ) : (
    <Link href={href} className={className}>
      {children}
    </Link>
  );
}

function ProductCard({ product }: { product: LandingOfferProduct }) {
  const price = finalPrice(product);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-lg dark:border-zinc-800 dark:bg-zinc-900"
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
        {product.discountPercent ? (
          <span className="absolute left-3 top-3 rounded-lg bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
            -{product.discountPercent}%
          </span>
        ) : null}
      </div>
      <div className="space-y-1 p-4 text-center">
        <h4 className="line-clamp-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          {product.name}
        </h4>
        {price != null && (
          <p className="text-sm">
            <span className="font-bold text-fuchsia-600 dark:text-fuchsia-400">{formatLKR(price)}</span>
            {product.discountPercent && product.sellingPrice != null && (
              <span className="ml-2 text-xs text-zinc-400 line-through">
                {formatLKR(product.sellingPrice)}
              </span>
            )}
          </p>
        )}
      </div>
    </Link>
  );
}

export default function OfferDetail({
  offer,
  isFirst = true,
  showBack = false,
  onClose,
}: {
  offer: LandingOffer;
  isFirst?: boolean;
  showBack?: boolean;
  onClose?: () => void;
}) {
  const Heading = isFirst ? "h1" : "h2";
  const banner = offer.image || offer.images[0] || offer.products[0]?.image || null;
  const ctaHref = offer.ctaLink || "/collection";

  const gallery = offer.images.filter((src) => src && src !== banner);
  const paragraphs = (offer.description ?? "")
    .split(/\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
  const [intro, ...rest] = paragraphs;

  return (
    <section className="bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100">

      {/* ── Full-bleed Banner Hero ── */}
      <div className="relative isolate min-h-[70vh] overflow-hidden text-white md:min-h-[80vh]">
        {/* Background image */}
        {banner ? (
          <img
            src={banner}
            alt=""
            aria-hidden
            className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
          />
        ) : (
          <div className="absolute inset-0 -z-20 bg-gradient-to-br from-fuchsia-700 via-purple-800 to-zinc-950" />
        )}

        {/* Layered overlays for depth */}
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/50 to-transparent" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

        {/* Back / Close button */}
        {(showBack || onClose) && (
          <div className="absolute left-6 top-6 z-10">
            {onClose ? (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" /> Back to offers
              </button>
            ) : (
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-sm font-semibold backdrop-blur-md transition hover:bg-white/20"
              >
                <ArrowLeft className="h-4 w-4" /> All offers
              </Link>
            )}
          </div>
        )}

        {/* Hero content — left-aligned */}
        <div className="mx-auto flex h-full min-h-[70vh] max-w-6xl flex-col justify-end px-6 pb-16 pt-24 md:min-h-[80vh] md:pb-20">
          <div className="max-w-2xl space-y-4">
            {offer.badgeText && (
              <span className="inline-block rounded-full bg-fuchsia-500 px-4 py-1.5 text-xs font-black uppercase tracking-widest shadow-lg">
                {offer.badgeText}
              </span>
            )}

            <Heading className="text-4xl font-black leading-tight drop-shadow-lg sm:text-5xl md:text-7xl">
              {offer.title}
            </Heading>

            {offer.subtitle && (
              <p className="text-xl font-semibold text-fuchsia-200 drop-shadow md:text-2xl">
                {offer.subtitle}
              </p>
            )}

            {offer.endsAt && <OfferCountdown endsAt={offer.endsAt} />}

            {/* CTA buttons inside banner */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <OfferCta
                href={ctaHref}
                className="inline-flex items-center gap-2 rounded-2xl bg-fuchsia-500 px-8 py-3.5 text-base font-bold text-white shadow-xl transition hover:bg-fuchsia-400 hover:shadow-fuchsia-500/40"
              >
                <ShoppingBag className="h-5 w-5" />
                {offer.ctaText || "Shop Now"}
              </OfferCta>

              <ClaimOfferButton
                offerId={offer.id}
                className="rounded-2xl border-2 border-white/60 bg-white/10 px-7 py-3 text-base font-bold text-white backdrop-blur-sm transition hover:bg-white hover:text-zinc-900 disabled:opacity-50"
              />

              {offer.promoCode && (
                <div className="rounded-2xl border-2 border-dashed border-fuchsia-300/60 bg-black/30 px-5 py-2.5 backdrop-blur-sm">
                  <span className="mr-2 text-xs uppercase tracking-wider text-white/60">Code</span>
                  <span className="font-mono text-lg font-black tracking-widest text-fuchsia-300">
                    {offer.promoCode}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div className="mx-auto max-w-6xl space-y-16 px-6 py-14 md:py-20">

        {/* Intro paragraph */}
        {intro && (
          <p className="mx-auto max-w-3xl text-center text-xl leading-relaxed text-zinc-600 dark:text-zinc-300">
            {intro}
          </p>
        )}

        {/* ── Related images + description (alternating) ── */}
        {gallery.length > 0 && (
          <div className="space-y-16">
            {gallery.slice(0, 6).map((src, i) => {
              const text = rest[i];
              return (
                <div
                  key={`${src}-${i}`}
                  className={`grid items-center gap-8 md:grid-cols-2 md:gap-14`}
                >
                  {/* Image */}
                  <div
                    className={`overflow-hidden rounded-3xl shadow-xl ${
                      i % 2 === 1 ? "md:order-2" : ""
                    }`}
                  >
                    <img
                      src={src}
                      alt={`${offer.title} — detail ${i + 1}`}
                      className="aspect-[4/3] w-full object-cover"
                    />
                  </div>

                  {/* Text */}
                  <div className={`space-y-4 ${i % 2 === 1 ? "md:order-1" : ""}`}>
                    {text ? (
                      <>
                        <div className="h-1 w-12 rounded-full bg-fuchsia-500" />
                        <p className="text-lg leading-relaxed text-zinc-600 dark:text-zinc-300">{text}</p>
                      </>
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <span className="text-4xl font-black text-zinc-200 dark:text-zinc-800">
                          {offer.title}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Back button (bottom) ── */}
        {(showBack || onClose) && (
          <div>
            {onClose ? (
              <button
                onClick={onClose}
                className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-900 hover:text-white dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" /> Back to offers
              </button>
            ) : (
              <Link
                href="/offers"
                className="inline-flex items-center gap-2 rounded-full border-2 border-zinc-300 px-5 py-2.5 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-900 hover:text-white dark:border-zinc-600 dark:text-zinc-300 dark:hover:bg-white dark:hover:text-zinc-900"
              >
                <ArrowLeft className="h-4 w-4" /> All offers
              </Link>
            )}
          </div>
        )}

        {/* ── Products ── */}
        {offer.products.length > 0 && (
          <div>
            <div className="mb-8 flex items-end justify-between">
              <div>
                <div className="mb-2 h-1 w-10 rounded-full bg-fuchsia-500" />
                <h3 className="text-2xl font-black md:text-3xl">Featured Products</h3>
                <p className="mt-1 text-sm text-zinc-500 dark:text-zinc-400">
                  {offer.products.length} item{offer.products.length !== 1 ? "s" : ""} in this offer
                </p>
              </div>
              {offer.products.length > MAX_INLINE_PRODUCTS && (
                <OfferCta
                  href={`/collection?offer=${offer.id}`}
                  className="hidden rounded-xl border-2 border-zinc-300 px-6 py-2.5 text-sm font-bold transition hover:bg-zinc-900 hover:text-white dark:border-zinc-600 dark:hover:bg-white dark:hover:text-zinc-900 md:inline-block"
                >
                  View all {offer.products.length}
                </OfferCta>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-5">
              {offer.products.slice(0, MAX_INLINE_PRODUCTS).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>

            {offer.products.length > MAX_INLINE_PRODUCTS && (
              <div className="mt-8 text-center md:hidden">
                <OfferCta
                  href={`/collection?offer=${offer.id}`}
                  className="inline-block rounded-xl border-2 border-zinc-300 px-8 py-3 font-bold transition hover:bg-zinc-900 hover:text-white dark:border-zinc-600 dark:hover:bg-white dark:hover:text-zinc-900"
                >
                  View all {offer.products.length} products
                </OfferCta>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
