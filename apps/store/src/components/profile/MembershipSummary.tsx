"use client";

import { Button } from "@online-store/ui/button";
import { TIERS } from "./constants";
import { money } from "./helpers";
import type { MembershipView } from "./types";
import { ProgressBar, TierChip, cardCls, h2Cls, mutedCls } from "./ui";

export function MembershipSummary({
  membership,
  onDetails,
}: {
  membership: MembershipView;
  onDetails?: () => void;
}) {
  const current = TIERS.find((t) => t.name === membership.tier)!;
  const nextIdx = TIERS.findIndex((t) => t.name === membership.tier) + 1;
  const next = TIERS[nextIdx];

  return (
    <div className={cardCls}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className={h2Cls}>Your membership</h2>
        {onDetails && (
          <Button variant="ghost" size="sm" onClick={onDetails}>
            See all benefits
          </Button>
        )}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <TierChip tier={current.name} />
        <span className={mutedCls}>{current.multiplier} points on every order</span>
      </div>

      {next ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm">
            Reach <b>{next.name}</b> by either goal below:
          </p>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span>Spend</span>
              <span>
                {money(membership.periodSpent)} / {money(next.minSpend)}
              </span>
            </div>
            <ProgressBar value={membership.periodSpent} max={next.minSpend} />
          </div>
          <div>
            <div className="mb-1 flex justify-between text-xs">
              <span>Orders</span>
              <span>
                {membership.periodOrders} / {next.minOrders}
              </span>
            </div>
            <ProgressBar value={membership.periodOrders} max={next.minOrders} />
          </div>
          <p className={mutedCls}>
            {money(Math.max(0, next.minSpend - membership.periodSpent))} more spend or{" "}
            {Math.max(0, next.minOrders - membership.periodOrders)} more orders to unlock{" "}
            {next.name}.
          </p>
        </div>
      ) : (
        <p className="mt-4 text-sm">You are at the highest tier. Thank you!</p>
      )}
    </div>
  );
}
