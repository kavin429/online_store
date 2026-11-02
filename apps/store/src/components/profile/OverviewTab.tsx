"use client";

import { Gift, Package, Star, Tag } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { money, orderTotal } from "./helpers";
import { MembershipCard } from "./MembershipCard";
import { MembershipSummary } from "./MembershipSummary";
import type { ProfileData, TabKey } from "./types";
import { StatusBadge, cardCls, h2Cls, mutedCls } from "./ui";

export function OverviewTab({
  data,
  goTo,
}: {
  data: ProfileData;
  goTo: (t: TabKey) => void;
}) {
  const { membership, user, orders, promos } = data;
  const stats = [
    { label: "Total orders", value: membership.totalOrders, icon: Package },
    { label: "Total spent", value: money(membership.totalSpent), icon: Tag },
    { label: "Reward points", value: membership.points.toLocaleString(), icon: Star },
    { label: "Active promos", value: promos.available.length, icon: Gift },
  ];

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
        <MembershipSummary membership={membership} onDetails={() => goTo("membership")} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 xl:grid-cols-4">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className={`${cardCls} !p-4`}>
            <Icon className="h-5 w-5 text-fuchsia-500" />
            <div className="mt-2 text-xl font-bold text-fuchsia-900 sm:text-2xl dark:text-fuchsia-100">
              {value}
            </div>
            <div className={mutedCls}>{label}</div>
          </div>
        ))}
      </div>

      <div className={cardCls}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className={h2Cls}>Recent orders</h2>
          <Button variant="ghost" size="sm" onClick={() => goTo("orders")}>
            View all
          </Button>
        </div>
        {orders.length === 0 ? (
          <p className={mutedCls}>You have not placed an order yet.</p>
        ) : (
          <ul className="divide-y divide-fuchsia-100 dark:divide-fuchsia-900/30">
            {orders.slice(0, 3).map((o) => (
              <li
                key={o.id}
                className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <div>
                  <div className="text-sm font-medium">{o.id}</div>
                  <div className={mutedCls}>{o.date}</div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={o.status} />
                  <span className="text-sm font-semibold">{money(orderTotal(o))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </>
  );
}
