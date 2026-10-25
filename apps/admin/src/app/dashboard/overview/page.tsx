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
    return function RechartsAreaComponent({ data, theme }: { data: typeof revenueData; theme: typeof getTheme extends (m: infer M) => infer R ? R : never }) {
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
    return function RechartsPieComponent({ data, mode }: { data: typeof orderStatus; mode: string }) {
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

// ---------- mock data ----------

const revenueData = [
  { day: "Mon", revenue: 42000 },
  { day: "Tue", revenue: 48500 },
  { day: "Wed", revenue: 39800 },
  { day: "Thu", revenue: 55200 },
  { day: "Fri", revenue: 61400 },
  { day: "Sat", revenue: 73900 },
  { day: "Sun", revenue: 68100 },
];

const orderStatus = [
  { name: "Delivered", value: 542, dark: "#e879f9", light: "#c026d3" },
  { name: "Pending", value: 128, dark: "#a78bfa", light: "#7c3aed" },
  { name: "Cancelled", value: 34, dark: "#fb7185", light: "#e11d48" },
  { name: "Returned", value: 19, dark: "#64748b", light: "#94a3b8" },
];

const vendors: VendorPerformance[] = [
  { name: "Kandy Textiles Co.", gmv: 812400, orders: 1204, rating: 4.8, tier: "Gold", share: 92 },
  { name: "Colombo Gadget Hub", gmv: 654200, orders: 980, rating: 4.6, tier: "Gold", share: 74 },
  { name: "Negombo Fresh Foods", gmv: 411900, orders: 1620, rating: 4.4, tier: "Silver", share: 47 },
  { name: "Galle Home Living", gmv: 298700, orders: 512, rating: 4.7, tier: "Silver", share: 34 },
  { name: "Ella Craft Studio", gmv: 152300, orders: 289, rating: 4.9, tier: "Bronze", share: 17 },
];

const stockBatches = [
  { id: "B-1042", received: "12 Jun", qty: 8, daysAged: 42 },
  { id: "B-1067", received: "29 Jun", qty: 26, daysAged: 25 },
  { id: "B-1103", received: "10 Jul", qty: 54, daysAged: 14 },
  { id: "B-1128", received: "18 Jul", qty: 90, daysAged: 6 },
];

const offersQueue = [
  { position: 1, name: "End of Season Clearance", vendor: "Kandy Textiles Co.", queuedSince: "3 days ago", status: "live" },
  { position: 2, name: "Back to School Bundle", vendor: "Colombo Gadget Hub", queuedSince: "1 day ago", status: "queued" },
  { position: 3, name: "Fresh Friday Deals", vendor: "Negombo Fresh Foods", queuedSince: "6 hrs ago", status: "queued" },
  { position: 4, name: "New Arrivals Spotlight", vendor: "Galle Home Living", queuedSince: "2 hrs ago", status: "queued" },
];

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
};

function KpiCard({ t, label, value, delta, positive, prefix }: KpiCardProps) {
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
        <span className={`font-sans ml-1 ${t.textFaint}`}>vs last week</span>
      </div>
    </div>
  );
}

export default function MarketplaceDashboard() {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const mode: "dark" | "light" = mounted && resolvedTheme === "light" ? "light" : "dark";
  const t = getTheme(mode);
  const totalStock = stockBatches.reduce((s, b) => s + b.qty, 0);

  if (!mounted) return null;

  return (
    <main className="flex flex-col gap-6">
        {/* KPI row */}
        <div className="grid grid-cols-4 gap-4">
          <KpiCard t={t} label="Gross Revenue" prefix="Rs. " value="388,900" delta="12.4%" positive />
          <KpiCard t={t} label="Orders Today" value="723" delta="4.1%" positive />
          <KpiCard t={t} label="Active Vendors" value="146" delta="2.0%" positive />
          <KpiCard t={t} label="Products Live" value="9,842" delta="0.6%" positive={false} />
        </div>

        {/* revenue + order status */}
        <div className="grid grid-cols-3 gap-4">
          <div className={`col-span-2 border rounded-md p-4 ${t.panel}`}>
            <div className="flex items-center justify-between mb-3">
              <span className={`text-xs ${t.textSub}`}>Revenue trend</span>
              <span className="text-xs font-mono text-emerald-500">+18.2%</span>
            </div>
            <RechartsArea data={revenueData} theme={t} />
          </div>

          <div className={`border rounded-md p-4 flex flex-col ${t.panel}`}>
            <span className={`text-xs mb-2 ${t.textSub}`}>Order status</span>
            <div className="flex-1 flex items-center justify-center relative">
              <RechartsPie data={orderStatus} mode={t.mode} />
              <div className="absolute flex flex-col items-center">
                <span className="font-mono text-lg">723</span>
                <span className={`text-[10px] ${t.textMuted}`}>orders</span>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
              {orderStatus.map((s) => (
                <div key={s.name} className={`flex items-center gap-1.5 text-[11px] ${t.textSub}`}>
                  <span
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ background: t.mode === "dark" ? s.dark : s.light }}
                  />
                  {s.name}
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
          <div className={`flex flex-col divide-y ${t.divide}`}>
            {vendors.map((v, i) => (
              <div key={v.name} className="flex items-center gap-4 py-2.5">
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
                <span className={`font-mono text-xs w-24 text-right ${t.textBody}`}>
                  {currency(v.gmv)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* FIFO stock queue — signature element */}
        <div className={`border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <span className={`text-xs ${t.textSub}`}>Stock queue · Cotton Tote Bag</span>
              <p className={`text-[11px] mt-0.5 ${t.textFaint}`}>
                FIFO costing — oldest batch ships and gets costed out first
              </p>
            </div>
            <span className={`font-mono text-xs ${t.textSub}`}>
              {totalStock} units on hand
            </span>
          </div>
          <div className="flex items-stretch gap-3 overflow-x-auto pb-1">
            {stockBatches.map((b, i) => (
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
                {i < stockBatches.length - 1 && (
                  <ArrowRight size={14} className={`mx-1 shrink-0 ${t.textFaint}`} />
                )}
              </div>
            ))}
          </div>
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
        </div>
    </main>
  );
}