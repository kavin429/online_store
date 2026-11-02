"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { TABS } from "./constants";
import { initialsFor } from "./helpers";
import { MembershipTab } from "./MembershipTab";
import { OrdersTab } from "./OrdersTab";
import { OverviewTab } from "./OverviewTab";
import { PromosTab } from "./PromosTab";
import { SettingsTab } from "./SettingsTab";
import type { ProfileData, TabKey } from "./types";
import { TierChip, mutedCls } from "./ui";

export function ProfileClient({ data }: { data: ProfileData }) {
  const [tab, setTab] = useState<TabKey>("overview");
  const meta = TABS.find((item) => item.key === tab) ?? TABS[0];
  const initials = initialsFor(data.user.name);

  const badgeFor = (key: TabKey) =>
    key === "orders"
      ? data.membership.activeOrders
      : key === "promos"
        ? data.promos.available.length
        : 0;

  const logOut = () => signOut({ callbackUrl: "/" });

  return (
    <div className="mx-auto mt-10 w-full max-w-6xl px-4 pb-28 pt-6 lg:flex lg:gap-8 lg:pb-10 lg:pt-10">
      {/* Side navigation — stays in view while the page scrolls */}
      <aside className="hidden lg:block lg:w-64 lg:shrink-0">
        <div className="sticky top-6 space-y-4 rounded-2xl border border-fuchsia-200 bg-background p-4 shadow-sm dark:border-fuchsia-900/50">
          <div className="flex items-center gap-3 border-b border-fuchsia-100 pb-4 dark:border-fuchsia-900/40">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-400 font-bold text-white">
              {initials}
            </div>
            <div className="min-w-0">
              <div className="truncate text-sm font-semibold">{data.user.name}</div>
              <div className={`mb-1 truncate text-xs ${mutedCls}`}>{data.user.email}</div>
              <TierChip tier={data.membership.tier} />
            </div>
          </div>

          <nav className="space-y-1" aria-label="Profile sections">
            {TABS.map(({ key, label, icon: Icon }) => {
              const active = tab === key;
              const count = badgeFor(key);
              return (
                <button
                  key={key}
                  onClick={() => setTab(key)}
                  className={`flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-fuchsia-600 text-white shadow-md shadow-fuchsia-300/40 dark:shadow-none"
                      : "text-fuchsia-800 hover:bg-fuchsia-100 dark:text-fuchsia-200 dark:hover:bg-fuchsia-950/50"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span className="flex-1 text-left">{label}</span>
                  {count > 0 && (
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs ${
                        active
                          ? "bg-white/25 text-white"
                          : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>

          <div className="border-t border-fuchsia-100 pt-3 dark:border-fuchsia-900/40">
            <Button variant="ghost" className="w-full justify-start gap-3" onClick={logOut}>
              <LogOut className="h-4 w-4" /> Log out
            </Button>
          </div>
        </div>
      </aside>

      <main className="min-w-0 flex-1 space-y-6">
        {/* Mobile identity */}
        <div className="flex items-center gap-3 lg:hidden">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-fuchsia-600 to-fuchsia-400 font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold">{data.user.name}</div>
            <TierChip tier={data.membership.tier} />
          </div>
        </div>

        <header>
          <h1 className="text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">
            {meta.label}
          </h1>
          <p className={mutedCls}>{meta.desc}</p>
        </header>

        {tab === "overview" && <OverviewTab data={data} goTo={setTab} />}
        {tab === "orders" && <OrdersTab orders={data.orders} />}
        {tab === "membership" && (
          <MembershipTab membership={data.membership} user={data.user} />
        )}
        {tab === "promos" && <PromosTab promos={data.promos} email={data.user.email} />}
        {tab === "settings" && <SettingsTab data={data} onDeleted={() => signOut({ callbackUrl: "/" })} />}
      </main>

      {/* Mobile bottom navigation (fixed) */}
      <nav
        className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-fuchsia-200 bg-background/95 backdrop-blur lg:hidden dark:border-fuchsia-900/50"
        aria-label="Profile sections"
      >
        {TABS.map(({ key, label, icon: Icon }) => {
          const active = tab === key;
          const count = badgeFor(key);
          return (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`relative flex flex-col items-center gap-0.5 py-2.5 text-[11px] font-medium ${
                active ? "text-fuchsia-600 dark:text-fuchsia-400" : "text-zinc-500"
              }`}
            >
              {active && (
                <span className="absolute inset-x-4 top-0 h-0.5 rounded-full bg-fuchsia-600" />
              )}
              <span className="relative">
                <Icon className="h-5 w-5" />
                {count > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-600 px-1 text-[10px] text-white">
                    {count}
                  </span>
                )}
              </span>
              {label}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
