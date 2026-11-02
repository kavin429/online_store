"use client";

import { useState } from "react";
import { Check, Crown, Eye, EyeOff, Lock, Wifi } from "lucide-react";
import { TIERS } from "./constants";
import type { TierName } from "./types";

export function MembershipCard({
  tier,
  name,
  memberNo,
  since,
  validThru,
  locked = false,
}: {
  tier: TierName;
  name: string;
  memberNo: string;
  since: string;
  validThru: string;
  locked?: boolean;
}) {
  const t = TIERS.find((x) => x.name === tier)!;
  const [flipped, setFlipped] = useState(false);
  const [reveal, setReveal] = useState(false);

  const number = reveal
    ? memberNo.replace(/(\d{4})(?=\d)/g, "$1 ")
    : `•••• •••• •••• ${memberNo.slice(-4)}`;

  const face = `absolute inset-0 overflow-hidden rounded-2xl bg-gradient-to-br ${t.card} ${t.cardText} shadow-xl [backface-visibility:hidden]`;

  return (
    <div className="w-full max-w-sm">
      <div
        role="button"
        tabIndex={0}
        aria-label={`${tier} membership card. Press to flip.`}
        onClick={() => !locked && setFlipped((f) => !f)}
        onKeyDown={(e) => {
          if (!locked && (e.key === "Enter" || e.key === " ")) {
            e.preventDefault();
            setFlipped((f) => !f);
          }
        }}
        className="relative aspect-[1.586/1] w-full cursor-pointer select-none [perspective:1000px]"
      >
        <div
          className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
            flipped ? "[transform:rotateY(180deg)]" : ""
          } ${locked ? "grayscale-[60%]" : ""}`}
        >
          {/* FRONT */}
          <div className={`${face} p-4 sm:p-5`}>
            <div className="pointer-events-none absolute -right-10 -top-10 h-44 w-44 rounded-full bg-white/25 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-14 -left-10 h-44 w-44 rounded-full bg-black/10 blur-2xl" />

            <div className="relative flex h-full flex-col justify-between">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-[10px] font-bold uppercase tracking-[0.25em] opacity-80">
                    Online Store
                  </div>
                  <div className="text-xs font-semibold">Member Card</div>
                </div>
                <Wifi className="h-6 w-6 rotate-90 opacity-80" />
              </div>

              <div>
                <div className="mb-2 flex items-center gap-3">
                  <div className="h-7 w-10 rounded-md bg-gradient-to-br from-yellow-200 via-yellow-400 to-yellow-600 ring-1 ring-black/15 sm:h-8 sm:w-11" />
                  <button
                    type="button"
                    aria-label={reveal ? "Hide card number" : "Show card number"}
                    onClick={(e) => {
                      e.stopPropagation();
                      setReveal((r) => !r);
                    }}
                    className="rounded p-1 opacity-70 hover:opacity-100"
                  >
                    {reveal ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="font-mono text-base tracking-[0.15em] sm:text-lg">{number}</div>
              </div>

              <div className="flex items-end justify-between gap-2">
                <div className="min-w-0">
                  <div className="truncate text-sm font-semibold uppercase tracking-wide">{name}</div>
                  <div className="text-[10px] opacity-75">
                    SINCE {since} · VALID THRU {validThru}
                  </div>
                </div>
                <div className="flex items-center gap-1 text-lg font-extrabold italic tracking-tight sm:text-xl">
                  <Crown className="h-4 w-4" /> {tier.toUpperCase()}
                </div>
              </div>
            </div>
          </div>

          {/* BACK */}
          <div className={`${face} [transform:rotateY(180deg)]`}>
            <div className="mt-5 h-9 bg-black/80" />
            <div className="space-y-2 p-4 sm:p-5">
              <div className="text-[10px] font-bold uppercase tracking-widest opacity-75">
                {tier} benefits · {t.multiplier} points
              </div>
              <ul className="space-y-1 text-xs">
                {t.perks.slice(0, 3).map((p) => (
                  <li key={p} className="flex gap-1.5">
                    <Check className="mt-0.5 h-3 w-3 shrink-0" /> {p}
                  </li>
                ))}
              </ul>
              <div className="flex items-center justify-between rounded bg-white/60 px-2 py-1 text-[10px] font-medium text-zinc-800">
                <span>Show this card at checkout</span>
                <span className="font-mono">{memberNo.slice(-4)}</span>
              </div>
            </div>
          </div>
        </div>

        {locked && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-1 rounded-2xl bg-black/45 text-white backdrop-blur-[1px]">
            <Lock className="h-6 w-6" />
            <span className="text-xs font-semibold">Locked</span>
          </div>
        )}
      </div>

      {!locked && (
        <button
          type="button"
          onClick={() => setFlipped((f) => !f)}
          className="mt-2 text-xs font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-400"
        >
          {flipped ? "Show front" : "Flip card to see benefits"}
        </button>
      )}
    </div>
  );
}
