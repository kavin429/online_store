import Link from "next/link";
import { ArrowRight, Tag, Clock } from "lucide-react";
import type { LandingOffer } from "@/lib/offers";

export default function OfferCard({ offer, selected = false }: { offer: LandingOffer; selected?: boolean }) {
  const img = offer.image || offer.images[0] || offer.products[0]?.image || null;

  const daysLeft = offer.endsAt
    ? Math.max(0, Math.ceil((new Date(offer.endsAt).getTime() - Date.now()) / 86_400_000))
    : null;

  return (
    <Link
      href={`/offers/${offer.id}`}
      className={`group relative flex flex-col overflow-hidden rounded-3xl bg-white shadow-md ring-2 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl dark:bg-zinc-900 ${
        selected
          ? "ring-fuchsia-500 shadow-fuchsia-200 dark:shadow-fuchsia-900"
          : "ring-zinc-200 dark:ring-zinc-800"
      }`}
    >
      {/* Image */}
      <div className="relative aspect-[16/9] overflow-hidden">
        {img ? (
          <img
            src={img}
            alt={offer.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-fuchsia-600 to-purple-800">
            <Tag className="h-12 w-12 text-white/60" />
          </div>
        )}

        {/* Dark overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

        {/* Badge */}
        {offer.badgeText && (
          <span className="absolute left-3 top-3 rounded-full bg-fuchsia-500 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white shadow-lg">
            {offer.badgeText}
          </span>
        )}

        {/* Countdown pill */}
        {daysLeft !== null && (
          <span className="absolute bottom-3 right-3 inline-flex items-center gap-1 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white backdrop-blur-sm">
            <Clock className="h-3 w-3" />
            {daysLeft === 0 ? "Ends today" : `${daysLeft}d left`}
          </span>
        )}
      </div>

      {/* Body */}
      <div className="flex flex-1 flex-col gap-2 p-5">
        <h2 className="line-clamp-1 text-lg font-bold text-zinc-900 dark:text-zinc-100">{offer.title}</h2>

        {offer.subtitle && (
          <p className="line-clamp-1 text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">{offer.subtitle}</p>
        )}

        {offer.description && (
          <p className="line-clamp-2 text-sm leading-relaxed text-zinc-500 dark:text-zinc-400">{offer.description}</p>
        )}

        {/* Product count chips */}
        {offer.products.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1.5">
            {offer.products.slice(0, 3).map((p) => (
              <span
                key={p.id}
                className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300"
              >
                {p.name}
              </span>
            ))}
            {offer.products.length > 3 && (
              <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-[11px] font-medium text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
                +{offer.products.length - 3} more
              </span>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-auto flex items-center justify-between border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <span className="text-xs text-zinc-400">
            {offer.products.length} product{offer.products.length !== 1 ? "s" : ""}
          </span>
          <span className="inline-flex items-center gap-1 text-sm font-bold text-fuchsia-600 transition-all group-hover:gap-2 dark:text-fuchsia-400">
            View offer <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
