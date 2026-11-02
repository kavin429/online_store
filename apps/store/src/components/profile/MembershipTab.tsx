"use client";

import { Check } from "lucide-react";
import { TIERS } from "./constants";
import { MembershipCard } from "./MembershipCard";
import { MembershipSummary } from "./MembershipSummary";
import type { MembershipView, ProfileUser } from "./types";
import { TierChip, cardCls, h2Cls, mutedCls } from "./ui";

export function MembershipTab({
  membership,
  user,
}: {
  membership: MembershipView;
  user: ProfileUser;
}) {
  const currentIdx = TIERS.findIndex((t) => t.name === membership.tier);

  return (
    <>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <MembershipCard
          tier={membership.tier}
          name={user.name}
          memberNo={membership.memberNo}
          since={membership.since}
          validThru={membership.validThru}
        />
        <MembershipSummary membership={membership} />
      </div>

      <div className={cardCls}>
        <h2 className={h2Cls}>Tier cards &amp; requirements</h2>
        <p className={mutedCls}>Move up automatically when you hit either goal.</p>

        <div className="mt-5 grid gap-6 md:grid-cols-3">
          {TIERS.map((t, i) => {
            const isCurrent = i === currentIdx;
            const reached = i <= currentIdx;
            return (
              <div key={t.name} className="space-y-3">
                <MembershipCard
                  tier={t.name}
                  name={user.name}
                  memberNo={membership.memberNo}
                  since={membership.since}
                  validThru={membership.validThru}
                  locked={!reached}
                />
                <div
                  className={`rounded-xl border-2 p-3 ${t.ring} ${
                    isCurrent ? "bg-fuchsia-50/60 dark:bg-fuchsia-950/20" : ""
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <TierChip tier={t.name} />
                    {isCurrent && (
                      <span className="rounded-full bg-fuchsia-600 px-2 py-0.5 text-xs font-medium text-white">
                        Your tier
                      </span>
                    )}
                    {reached && !isCurrent && <Check className="h-4 w-4 text-green-600" />}
                  </div>
                  <p className="mt-2 text-sm font-medium">{t.requirement}</p>
                  <ul className="mt-2 space-y-1.5">
                    {t.perks.map((p) => (
                      <li key={p} className="flex gap-2 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className={cardCls}>
        <h2 className={h2Cls}>How it works</h2>
        <ol className="mt-4 grid gap-4 sm:grid-cols-3">
          {[
            {
              title: "Shop & earn",
              text: "Earn points on every order. Your tier sets the multiplier (1x, 1.5x or 2x).",
            },
            {
              title: "Reach a goal",
              text: "Hit the spend or order target for the next tier within 12 months.",
            },
            {
              title: "Upgrade automatically",
              text: "Your new card and benefits start immediately and we email you the good news.",
            },
          ].map((s, i) => (
            <li key={s.title} className="flex gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-600 text-sm font-bold text-white">
                {i + 1}
              </span>
              <div>
                <div className="text-sm font-semibold">{s.title}</div>
                <p className={mutedCls}>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </>
  );
}
