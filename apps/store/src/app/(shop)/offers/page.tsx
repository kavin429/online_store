import Link from "next/link";
import { getActiveOffers, type LandingOffer, type LandingOfferProduct } from "@/lib/offers";
import { formatLKR } from "@/lib/utils";
import OfferCountdown from "@/components/offer/offer-countdown";
import ClaimOfferButton from "@/components/offer/claim-offer-button";

export const dynamic = "force-dynamic"; // always show what admin just changed

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

const finalPrice = (p: LandingOfferProduct) =>
  p.sellingPrice == null
    ? null
    : p.discountPercent
      ? p.sellingPrice * (1 - p.discountPercent / 100)
      : p.sellingPrice;

const MAX_INLINE_PRODUCTS = 8;

function OfferGallery({ images }: { images: string[] }) {
  const gallery = images.filter(Boolean);
  if (gallery.length === 0) return null;
  return (
    <div className="mx-auto mt-14 max-w-5xl">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {gallery.slice(0, 8).map((src, i) => (
          <div
            key={i}
            className={`overflow-hidden rounded-2xl border border-white/15 bg-white/5 ${
              i === 0 ? "col-span-2 row-span-2" : ""
            }`}
          >
            <img src={src} alt="" className="h-full w-full object-cover" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ProductCard({ product }: { product: LandingOfferProduct }) {
  const price = finalPrice(product);
  return (
    <Link
      href={`/products/${product.id}`}
      className="group block overflow-hidden rounded-2xl bg-white text-zinc-900 shadow-xl transition-transform hover:-translate-y-1"
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
        <span className="mt-2 inline-block rounded-lg bg-zinc-900 px-4 py-1.5 text-xs font-semibold text-white group-hover:bg-fuchsia-600">
          View
        </span>
      </div>
    </Link>
  );
}

function FestivalSection({ offer, index }: { offer: LandingOffer; index: number }) {
  const bg = offer.image || offer.products[0]?.image || null;
  const isFirst = index === 0;
  const Heading = isFirst ? "h1" : "h2";
  const ctaHref = offer.ctaLink || "/collection";

  return (
    <section className="relative isolate overflow-hidden text-white">
      {/* image background (from the offer's Banner Image) */}
      {bg ? (
        <img
          src={bg}
          alt=""
          aria-hidden
          className="absolute inset-0 -z-20 h-full w-full object-cover"
        />
      ) : (
        <div className="absolute inset-0 -z-20 bg-gradient-to-br from-fuchsia-700 via-purple-800 to-zinc-950" />
      )}
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-black/60 via-black/50 to-black/85" />

      <div className={`mx-auto max-w-7xl px-6 ${isFirst ? "py-28 md:py-40" : "py-20 md:py-28"}`}>
        <div className="mx-auto max-w-3xl space-y-6 text-center">
          {offer.badgeText && (
            <span className="inline-block rounded-full bg-fuchsia-500 px-5 py-2 text-sm font-black uppercase tracking-widest shadow-lg">
              {offer.badgeText}
            </span>
          )}

          <Heading className="text-5xl font-black leading-tight md:text-7xl">{offer.title}</Heading>

          {offer.subtitle && (
            <p className="text-xl font-semibold text-fuchsia-200 md:text-2xl">{offer.subtitle}</p>
          )}

          {offer.description && (
            <p className="mx-auto max-w-2xl text-lg leading-relaxed text-white/80">
              {offer.description}
            </p>
          )}

          {offer.endsAt && <OfferCountdown endsAt={offer.endsAt} />}

          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <OfferCta
              href={ctaHref}
              className="rounded-2xl bg-fuchsia-500 px-9 py-4 font-bold shadow-lg transition-colors hover:bg-fuchsia-600"
            >
              {offer.ctaText || "Shop Now"}
            </OfferCta>

            {offer.promoCode && (
              <div className="rounded-2xl border-2 border-dashed border-white/60 bg-white/10 px-6 py-3 backdrop-blur-sm">
                <span className="mr-2 text-xs uppercase tracking-wider text-white/70">Use code</span>
                <span className="font-mono text-lg font-bold tracking-widest">{offer.promoCode}</span>
              </div>
            )}

            <ClaimOfferButton
              offerId={offer.id}
              className="rounded-2xl border-2 border-white/70 px-8 py-3 font-bold text-white transition-colors hover:bg-white hover:text-zinc-950 disabled:opacity-60"
            />
          </div>
        </div>

        {offer.images.length > 0 && <OfferGallery images={offer.images} />}

        {offer.products.length > 0 && (
          <div className="mt-16">
            <h3 className="mb-8 text-center text-2xl font-bold md:text-3xl">
              Featured in {offer.title}
            </h3>
            <div className="grid grid-cols-2 gap-5 md:grid-cols-4">
              {offer.products.slice(0, MAX_INLINE_PRODUCTS).map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
            {offer.products.length > MAX_INLINE_PRODUCTS && (
              <div className="mt-10 text-center">
                <OfferCta
                  href={`/collection?offer=${offer.id}`}
                  className="inline-block rounded-2xl border-2 border-white/70 px-8 py-3 font-bold text-white transition-colors hover:bg-white hover:text-zinc-900"
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

export default async function OfferPage() {
  const offers = await getActiveOffers();

  if (offers.length === 0) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center bg-gradient-to-br from-fuchsia-50 via-white to-amber-50 px-6 dark:from-zinc-950 dark:via-zinc-900 dark:to-black">
        <div className="text-center">
          <div className="mb-4 text-6xl">🎁</div>
          <h1 className="mb-2 text-3xl font-black">No offers right now</h1>
          <p className="text-zinc-500 dark:text-zinc-400">New deals are on the way — check back soon!</p>
        </div>
      </div>
    );
  }

  return (
    <main>
      {offers.map((offer, i) => (
        <FestivalSection key={offer.id} offer={offer} index={i} />
      ))}
    </main>
  );
}