"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  ArrowRight,
  Star,
} from "lucide-react";
import dynamic from "next/dynamic";
import type { VendorPerformance } from "@/lib/types";

const RechartsArea = dynamic(
  () => import("recharts").then((mod) => {
    const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod;
    return function RechartsAreaComponent({ data, theme }: { data: { day: string; revenue: number }[]; theme: ReturnType<typeof getTheme> }) {
      return (
        <ResponsiveContainer width="100%" height={180}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={theme.accentHex} stopOpacity={0.35} />
                <stop offset="100%" stopColor={theme.accentHex} stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="day"
              stroke={theme.axisStroke}
              tick={{ fill: theme.axisTick, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis hide />
            <Tooltip
              contentStyle={{
                background: theme.tooltipBg,
                border: `1px solid ${theme.tooltipBorder}`,
                borderRadius: 6,
                fontSize: 12,
              }}
              labelStyle={{ color: theme.tooltipLabel }}
              formatter={(v: number) => [`Rs. ${v.toLocaleString()}`, "Revenue"]}
            />
            <Area
              type="monotone"
              dataKey="revenue"
              stroke={theme.accentHex}
              strokeWidth={2}
              fill="url(#rev)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[180px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded" /> }
);

const RechartsPie = dynamic(
  () => import("recharts").then((mod) => {
    const { PieChart, Pie, Cell, ResponsiveContainer } = mod;
    return function RechartsPieComponent({ data, mode }: { data: { name: string; value: number; dark: string; light: string }[]; mode: string }) {
      return (
        <ResponsiveContainer width="100%" height={140}>
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={38}
              outerRadius={58}
              paddingAngle={3}
              stroke="none"
            >
              {data.map((s) => (
                <Cell key={s.name} fill={mode === "dark" ? s.dark : s.light} />
              ))}
            </Pie>
          </PieChart>
        </ResponsiveContainer>
      );
    };
  }),
  { ssr: false, loading: () => <div className="h-[140px] animate-pulse bg-slate-200 dark:bg-slate-800 rounded" /> }
);

// ── data shape returned by GET /api/dashboard ──

type DashboardData = {
  stats: {
    grossRevenue: number;
    revenueDeltaPct: number;
    ordersToday: number;
    ordersDeltaPct: number;
    activeVendors: number;
    newVendorsThisWeek: number;
    productsLive: number;
    newProductsThisWeek: number;
  };
  revenueTrend: { day: string; revenue: number }[];
  orderStatus: { name: string; value: number; dark: string; light: string }[];
  totalOrders: number;
  vendors: (VendorPerformance & { id: number })[];
  stockQueue: {
    productName: string;
    totalStock: number;
    batches: { id: string; received: string; qty: number; daysAged: number }[];
  } | null;
  offersQueue: { position: number; name: string; vendor: string; queuedSince: string; status: "live" | "queued" }[];
};

const currency = (n: number) => `Rs. ${n.toLocaleString()}`;

// ---------- theme tokens ----------

function getTheme(mode: "dark" | "light") {
  const dark = mode === "dark";
  return {
    mode,
    page: dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
    panel: dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
    headerBorder: dark ? "border-slate-800" : "border-slate-200",
    divide: dark ? "divide-slate-800" : "divide-slate-200",
    inputBg: dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
    textFaint: dark ? "text-slate-600" : "text-slate-400",
    textMuted: dark ? "text-slate-500" : "text-slate-500",
    textSub: dark ? "text-slate-400" : "text-slate-500",
    textBody: dark ? "text-slate-200" : "text-slate-700",
    trackBg: dark ? "bg-slate-800" : "bg-slate-200",
    cardAlt: dark ? "bg-slate-950" : "bg-slate-50",
    axisStroke: dark ? "#475569" : "#94a3b8",
    axisTick: dark ? "#64748b" : "#64748b",
    tooltipBg: dark ? "#0f172a" : "#ffffff",
    tooltipBorder: dark ? "#1e293b" : "#e2e8f0",
    tooltipLabel: dark ? "#94a3b8" : "#475569",
    accentHex: dark ? "#e879f9" : "#c026d3",
    accentBg: dark ? "bg-fuchsia-400" : "bg-fuchsia-600",
    accentText: dark ? "text-fuchsia-400" : "text-fuchsia-600",
    accentSoftBg: dark ? "bg-fuchsia-400/5" : "bg-fuchsia-50",
    accentSoftBorder: dark ? "border-fuchsia-400/60" : "border-fuchsia-400",
    accentBarBg: dark ? "bg-fuchsia-400/70" : "bg-fuchsia-500/80",
    accentBadge: dark
      ? "bg-fuchsia-400/10 text-fuchsia-400 border-fuchsia-400/30"
      : "bg-fuchsia-50 text-fuchsia-600 border-fuchsia-300",
    liveBadge: dark
      ? "bg-emerald-400/10 text-emerald-400 border-emerald-400/30"
      : "bg-emerald-50 text-emerald-600 border-emerald-300",
    liveDot: dark ? "bg-emerald-400/10 text-emerald-400" : "bg-emerald-50 text-emerald-600",
    queuedBadge: dark
      ? "bg-slate-800 text-slate-400 border-slate-700"
      : "bg-slate-100 text-slate-500 border-slate-300",
    queuedDot: dark ? "bg-slate-800 text-slate-500" : "bg-slate-100 text-slate-500",
  };
}

type Theme = ReturnType<typeof getTheme>;

type TierBadgeProps = {
  tier: "Gold" | "Silver" | "Bronze";
  t: Theme;
};

function TierBadge({ tier, t }: TierBadgeProps) {
  const styles: Record<TierBadgeProps["tier"], string> = {
    Gold: t.accentBadge,
    Silver: t.mode === "dark"
      ? "bg-slate-400/10 text-slate-300 border-slate-400/30"
      : "bg-slate-100 text-slate-600 border-slate-300",
    Bronze: t.mode === "dark"
      ? "bg-orange-400/10 text-orange-400/80 border-orange-400/20"
      : "bg-orange-50 text-orange-600 border-orange-200",
  };
  return (
    <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${styles[tier]}`}>
      {tier}
    </span>
  );
}

type KpiCardProps = {
  t: Theme;
  label: string;
  value: string;
  delta: string;
  positive: boolean;
  prefix?: string;
  deltaLabel?: string;
};

function KpiCard({ t, label, value, delta, positive, prefix, deltaLabel = "vs last week" }: KpiCardProps) {
  return (
    <div className={`border rounded-md p-4 flex flex-col gap-2 ${t.panel}`}>
      <span className={`text-xs tracking-wide ${t.textSub}`}>{label}</span>
      <span className="font-mono text-2xl">
        {prefix}
        {value}
      </span>
      <div
        className={`flex items-center gap-1 text-xs font-mono ${
          positive ? "text-emerald-500" : "text-rose-500"
        }`}
      >
        {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {delta}
        <span className={`font-sans ml-1 ${t.textFaint}`}>{deltaLabel}</span>
      </div>
    </div>
  );
}

export default function MarketplaceDashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
    let cancelled = false;
    fetch("/api/dashboard")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Request failed with status ${res.status}`);
        return res.json();
      })
      .then((json) => {
        if (cancelled) return;
        setData(json as DashboardData);
        setLoading(false);
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const mode: "dark" | "light" = mounted && resolvedTheme === "light" ? "light" : "dark";
  const t = getTheme(mode);

  if (!mounted) return null;

  if (loading) {
    return (
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="border rounded-md p-4 h-28 animate-pulse bg-slate-100 dark:bg-slate-800" />
          ))}
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div className="col-span-2 border rounded-md p-4 h-52 animate-pulse bg-slate-100 dark:bg-slate-800" />
          <div className="border rounded-md p-4 h-52 animate-pulse bg-slate-100 dark:bg-slate-800" />
        </div>
        <div className="border rounded-md p-4 h-40 animate-pulse bg-slate-100 dark:bg-slate-800" />
      </div>
    );
  }

  if (!data) return <div className="text-center py-10 text-muted-foreground">Failed to load dashboard data</div>;

  const { stats, revenueTrend, orderStatus, totalOrders, vendors, stockQueue, offersQueue } = data;

  return (
    <main className="flex flex-col gap-6">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard
            t={t}
            label="Gross Revenue"
            prefix="Rs. "
            value={stats.grossRevenue.toLocaleString()}
            delta={`${stats.revenueDeltaPct >= 0 ? "+" : ""}${stats.revenueDeltaPct.toFixed(1)}%`}
            positive={stats.revenueDeltaPct >= 0}
          />
          <KpiCard
            t={t}
            label="Orders Today"
            value={stats.ordersToday.toLocaleString()}
            delta={`${stats.ordersDeltaPct >= 0 ? "+" : ""}${stats.ordersDeltaPct.toFixed(1)}%`}
            positive={stats.ordersDeltaPct >= 0}
            deltaLabel="vs yesterday"
          />
          <KpiCard
            t={t}
            label="Active Vendors"
            value={stats.activeVendors.toLocaleString()}
            delta={`${stats.newVendorsThisWeek} new`}
            positive={stats.newVendorsThisWeek > 0}
            deltaLabel="this week"
          />
          <KpiCard
            t={t}
            label="Products Live"
            value={stats.productsLive.toLocaleString()}
            delta={`${stats.newProductsThisWeek} new`}
            positive={stats.newProductsThisWeek > 0}
            deltaLabel="this week"
          />
        </div>

        {/* revenue + order status */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2 border rounded-md p-4 ${t.panel}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs ${t.textSub}`}>Revenue trend (last 7 days)</span>
              <span className={`text-xs font-mono ${stats.revenueDeltaPct >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                {stats.revenueDeltaPct >= 0 ? "+" : ""}{stats.revenueDeltaPct.toFixed(1)}%
              </span>
            </div>
            {revenueTrend.some((d) => d.revenue > 0) ? (
              <RechartsArea data={revenueTrend} theme={t} />
            ) : (
              <div className={`h-[180px] flex items-center justify-center text-xs ${t.textFaint}`}>
                No revenue data yet
              </div>
            )}
          </div>

          <div className={`border rounded-md p-4 flex flex-col ${t.panel}`}>
            <span className={`text-xs mb-2 ${t.textSub}`}>Order status</span>
            <div className="flex-1 flex items-center justify-center relative">
              {totalOrders > 0 ? (
                <>
                  <RechartsPie data={orderStatus} mode={t.mode} />
                  <div className="absolute flex flex-col items-center">
                    <span className="font-mono text-lg">{totalOrders.toLocaleString()}</span>
                    <span className={`text-[10px] ${t.textMuted}`}>orders</span>
                  </div>
                </>
              ) : (
                <span className={`text-xs ${t.textFaint}`}>No orders yet</span>
              )}
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {orderStatus.map((s) => (
                <div key={s.name} className={`flex items-center gap-1.5 text-[11px] ${t.textSub}`}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: t.mode === "dark" ? s.dark : s.light }}
                  />
                  {s.name} ({s.value})
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* vendor performance */}
        <div className={`border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${t.textSub}`}>Vendor performance</span>
            <span className={`text-xs ${t.textFaint}`}>Ranked by GMV</span>
          </div>
          {vendors.length === 0 ? (
            <div className={`text-xs ${t.textFaint} py-6 text-center`}>No vendor sales data yet</div>
          ) : (
            <div className={`flex flex-col divide-y ${t.divide}`}>
              {vendors.map((v, i) => (
                <div key={v.id ?? i} className="flex items-center gap-4 py-2.5">
                  <span className={`font-mono text-xs w-4 ${t.textFaint}`}>{i + 1}</span>
                  <div className="w-40 shrink-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm truncate">{v.name}</span>
                      <TierBadge tier={v.tier} t={t} />
                    </div>
                    <div className={`flex items-center gap-1 text-[11px] mt-0.5 ${t.textMuted}`}>
                      <Star size={10} className={t.accentText} fill="currentColor" />
                      {v.rating} · {v.orders} orders
                    </div>
                  </div>
                  <div className={`flex-1 h-1.5 rounded-full overflow-hidden ${t.trackBg}`}>
                    <div
                      className={`h-full rounded-full ${t.accentBarBg}`}
                      style={{ width: `${v.share}%` }}
                    />
                  </div>
                  <span className="font-mono text-xs w-24 text-right">
                    {currency(v.gmv)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FIFO stock queue — signature element */}
        <div className={`border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`text-xs ${t.textSub}`}>
                Stock queue{stockQueue ? ` · ${stockQueue.productName}` : ""}
              </span>
              <p className={`text-[11px] mt-0.5 ${t.textFaint}`}>
                FIFO costing — oldest batch ships and gets costed out first
              </p>
            </div>
            {stockQueue && (
              <span className={`font-mono text-xs ${t.textSub}`}>
                {stockQueue.totalStock} units on hand
              </span>
            )}
          </div>
          {!stockQueue || stockQueue.batches.length === 0 ? (
            <div className={`text-xs ${t.textFaint} py-6 text-center`}>No stock batches on hand</div>
          ) : (
            <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
              {stockQueue.batches.map((b, i) => (
                <div key={b.id} className="flex items-center">
                  <div
                    className={`w-36 shrink-0 rounded-md border p-3 flex flex-col gap-2 ${
                      i === 0 ? `${t.accentSoftBorder} ${t.accentSoftBg}` : `${t.headerBorder} ${t.cardAlt}`
                    }`}
                  >
                    {i === 0 && (
                      <span className={`text-[10px] font-mono tracking-wide ${t.accentText}`}>
                        NEXT OUT
                      </span>
                    )}
                    <span className="font-mono text-sm">{b.id}</span>
                    <div className={`flex items-center gap-1 text-[11px] ${t.textMuted}`}>
                      <Clock size={11} />
                      Received {b.received}
                    </div>
                    <div className="flex items-end justify-between mt-1">
                      <span className="font-mono text-lg">{b.qty}</span>
                      <span className={`text-[10px] ${t.textFaint}`}>{b.daysAged}d aged</span>
                    </div>
                  </div>
                  {i < stockQueue.batches.length - 1 && (
                    <ArrowRight size={14} className={`mx-1 shrink-0 ${t.textFaint}`} />
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* FIFO offers / collections queue */}
        <div className={`border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-3">
            <div>
              <span className={`text-xs ${t.textSub}`}>Collections queue</span>
              <p className={`text-[11px] mt-0.5 ${t.textFaint}`}>
                Offers activate in submission order — oldest queued goes live next
              </p>
            </div>
          </div>
          {offersQueue.length === 0 ? (
            <div className={`text-xs ${t.textFaint} py-6 text-center`}>No offers in queue</div>
          ) : (
            <div className={`flex flex-col divide-y ${t.divide}`}>
              {offersQueue.map((o) => (
                <div key={o.position} className="flex items-center gap-4 py-2.5">
                  <span
                    className={`font-mono text-xs w-5 h-5 rounded flex items-center justify-center ${
                      o.status === "live" ? t.liveDot : t.queuedDot
                    }`}
                  >
                    {o.position}
                  </span>
                  <span className="text-sm flex-1">{o.name}</span>
                  <span className={`text-xs w-40 ${t.textMuted}`}>{o.vendor}</span>
                  <span className={`text-[11px] w-24 ${t.textFaint}`}>{o.queuedSince}</span>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded border ${
                      o.status === "live" ? t.liveBadge : t.queuedBadge
                    }`}
                  >
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
    </main>
  );
}
