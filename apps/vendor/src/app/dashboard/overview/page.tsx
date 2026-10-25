"use client";

import React, { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import {
  Package,
  ShoppingBag,
  AlertTriangle,
  TrendingUp,
  Star,
  Clock,
} from "lucide-react";
import dynamic from "next/dynamic";

const RechartsArea = dynamic(
  () => import("recharts").then((mod) => {
    const { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } = mod;
    return function RechartsAreaComponent({ data, theme }: { data: { date: string; revenue: number }[]; theme: ReturnType<typeof getTheme> }) {
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
              dataKey="date"
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

const STATUS_COLORS: Record<string, { dark: string; light: string }> = {
  DELIVERED: { dark: "#e879f9", light: "#c026d3" },
  PENDING: { dark: "#fbbf24", light: "#f59e0b" },
  CONFIRMED: { dark: "#a78bfa", light: "#7c3aed" },
  SHIPPED: { dark: "#34d399", light: "#10b981" },
  CANCELLED: { dark: "#fb7185", light: "#e11d48" },
};

const STATUS_BADGES: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
  CONFIRMED: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
  SHIPPED: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400",
  DELIVERED: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
  CANCELLED: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
};

const currency = (n: number) => `Rs. ${n.toLocaleString()}`;

function getTheme(mode: "dark" | "light") {
  const dark = mode === "dark";
  return {
    mode,
    page: dark ? "bg-slate-950 text-slate-100" : "bg-slate-50 text-slate-900",
    panel: dark ? "bg-slate-900 border-slate-800" : "bg-white border-slate-200",
    headerBorder: dark ? "border-slate-800" : "border-slate-200",
    divide: dark ? "divide-slate-800" : "divide-slate-200",
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
    accentText: dark ? "text-fuchsia-400" : "text-fuchsia-600",
    accentBarBg: dark ? "bg-fuchsia-400/70" : "bg-fuchsia-500/80",
    accentBadge: dark
      ? "bg-fuchsia-400/10 text-fuchsia-400 border border-fuchsia-400/30"
      : "bg-fuchsia-50 text-fuchsia-600 border border-fuchsia-300",
    warningBadge: dark
      ? "bg-amber-400/10 text-amber-400 border border-amber-400/30"
      : "bg-amber-50 text-amber-600 border border-amber-300",
    dangerBadge: dark
      ? "bg-red-400/10 text-red-400 border border-red-400/30"
      : "bg-red-50 text-red-600 border border-red-300",
  };
}

type DashboardData = {
  stats: {
    totalProducts: number;
    activeProducts: number;
    lowStockProducts: number;
    pendingOrders: number;
    todayOrders: number;
    todayRevenue: number;
    weekRevenue: number;
    unreadNotifications: number;
  };
  recentOrders: { id: number; customer: string; total: number; status: string; date: string; itemCount: number }[];
  recentReviews: { id: number; rating: number; comment: string | null; customer: string; product: string; date: string }[];
  orderStatusCounts: { status: string; count: number }[];
  weeklyRevenueTrend: { date: string; revenue: number }[];
  bestSellingProducts: { name: string; totalSold: number; orderCount: number }[];
};

// ── DEMO DATA (no DB / API call needed) ──
const DEMO_DATA: DashboardData = {
  stats: {
    totalProducts: 128,
    activeProducts: 112,
    lowStockProducts: 7,
    pendingOrders: 14,
    todayOrders: 23,
    todayRevenue: 84250,
    weekRevenue: 512300,
    unreadNotifications: 5,
  },
  recentOrders: [
    { id: 1042, customer: "Nadeesha Perera", total: 6450, status: "DELIVERED", date: "2026-09-08", itemCount: 3 },
    { id: 1041, customer: "Kasun Fernando", total: 12300, status: "SHIPPED", date: "2026-09-08", itemCount: 2 },
    { id: 1040, customer: "Ishara Silva", total: 3200, status: "PENDING", date: "2026-09-07", itemCount: 1 },
    { id: 1039, customer: "Dilshan Bandara", total: 8900, status: "CONFIRMED", date: "2026-09-07", itemCount: 4 },
    { id: 1038, customer: "Tharushi Jayasuriya", total: 4500, status: "CANCELLED", date: "2026-09-06", itemCount: 2 },
  ],
  recentReviews: [
    { id: 1, rating: 5, comment: "Great quality, fast delivery!", customer: "Nadeesha Perera", product: "Running Shoes X2", date: "2026-09-08" },
    { id: 2, rating: 4, comment: "Good but sizing runs small.", customer: "Kasun Fernando", product: "Leather Sandals", date: "2026-09-07" },
    { id: 3, rating: 5, comment: null, customer: "Ishara Silva", product: "Sports Sneakers", date: "2026-09-06" },
    { id: 4, rating: 3, comment: "Average product for the price.", customer: "Dilshan Bandara", product: "Formal Shoes", date: "2026-09-05" },
  ],
  orderStatusCounts: [
    { status: "DELIVERED", count: 48 },
    { status: "SHIPPED", count: 21 },
    { status: "CONFIRMED", count: 14 },
    { status: "PENDING", count: 14 },
    { status: "CANCELLED", count: 6 },
  ],
  weeklyRevenueTrend: [
    { date: "Mon", revenue: 42000 },
    { date: "Tue", revenue: 58000 },
    { date: "Wed", revenue: 39000 },
    { date: "Thu", revenue: 71000 },
    { date: "Fri", revenue: 65000 },
    { date: "Sat", revenue: 92000 },
    { date: "Sun", revenue: 84250 },
  ],
  bestSellingProducts: [
    { name: "Running Shoes X2", totalSold: 142, orderCount: 98 },
    { name: "Leather Sandals", totalSold: 118, orderCount: 76 },
    { name: "Sports Sneakers", totalSold: 97, orderCount: 61 },
    { name: "Formal Shoes", totalSold: 64, orderCount: 40 },
    { name: "Casual Loafers", totalSold: 51, orderCount: 33 },
  ],
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={12}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
        />
      ))}
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
    // Simulate a short load so skeletons are visible; swap DEMO_DATA for a real fetch later.
    const timer = setTimeout(() => {
      setData(DEMO_DATA);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
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
      </div>
    );
  }

  if (!data) return <div className="text-center py-10 text-muted-foreground">Failed to load dashboard data</div>;

  const { stats, recentOrders, recentReviews, orderStatusCounts, weeklyRevenueTrend, bestSellingProducts } = data;
  const totalOrderCount = orderStatusCounts.reduce((s, c) => s + c.count, 0);

  const pieData = orderStatusCounts.map((s) => ({
    name: s.status.charAt(0) + s.status.slice(1).toLowerCase(),
    value: s.count,
    dark: STATUS_COLORS[s.status]?.dark || "#64748b",
    light: STATUS_COLORS[s.status]?.light || "#94a3b8",
  }));

  const maxSold = bestSellingProducts.length > 0 ? Math.max(...bestSellingProducts.map((p) => p.totalSold)) : 1;

  return (
    <main className="flex flex-col gap-6">
      {/* KPI row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`border rounded-md p-4 flex flex-col gap-2 ${t.panel}`}>
          <div className="flex items-center gap-2">
            <TrendingUp size={14} className={t.accentText} />
            <span className={`text-xs tracking-wide ${t.textSub}`}>Revenue (Today)</span>
          </div>
          <span className="font-mono text-2xl">{currency(stats.todayRevenue)}</span>
          <span className={`text-xs font-mono ${t.textFaint}`}>{currency(stats.weekRevenue)} this week</span>
        </div>

        <div className={`border rounded-md p-4 flex flex-col gap-2 ${t.panel}`}>
          <div className="flex items-center gap-2">
            <ShoppingBag size={14} className={t.accentText} />
            <span className={`text-xs tracking-wide ${t.textSub}`}>Orders Today</span>
          </div>
          <span className="font-mono text-2xl">{stats.todayOrders}</span>
          <span className={`text-xs font-mono ${t.textFaint}`}>{stats.pendingOrders} pending</span>
        </div>

        <div className={`border rounded-md p-4 flex flex-col gap-2 ${t.panel}`}>
          <div className="flex items-center gap-2">
            <Package size={14} className={t.accentText} />
            <span className={`text-xs tracking-wide ${t.textSub}`}>Products</span>
          </div>
          <span className="font-mono text-2xl">{stats.activeProducts}</span>
          <span className={`text-xs font-mono ${t.textFaint}`}>{stats.totalProducts} total</span>
        </div>

        <div className={`border rounded-md p-4 flex flex-col gap-2 ${t.panel}`}>
          <div className="flex items-center gap-2">
            <AlertTriangle size={14} className={stats.lowStockProducts > 0 ? "text-amber-500" : t.textFaint} />
            <span className={`text-xs tracking-wide ${t.textSub}`}>Low Stock</span>
          </div>
          <span className={`font-mono text-2xl ${stats.lowStockProducts > 0 ? "text-amber-500" : ""}`}>
            {stats.lowStockProducts}
          </span>
          <span className={`text-xs font-mono ${t.textFaint}`}>products below 10 units</span>
        </div>
      </div>

      {/* Revenue + Order Status */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className={`col-span-2 border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${t.textSub}`}>Revenue trend (last 7 days)</span>
          </div>
          {weeklyRevenueTrend.some((d) => d.revenue > 0) ? (
            <RechartsArea data={weeklyRevenueTrend} theme={t} />
          ) : (
            <div className={`h-[180px] flex items-center justify-center text-xs ${t.textFaint}`}>
              No revenue data yet
            </div>
          )}
        </div>

        <div className={`border rounded-md p-4 flex flex-col ${t.panel}`}>
          <span className={`text-xs mb-2 ${t.textSub}`}>Order status (this week)</span>
          <div className="flex-1 flex items-center justify-center relative">
            {totalOrderCount > 0 ? (
              <>
                <RechartsPie data={pieData} mode={t.mode} />
                <div className="absolute flex flex-col items-center">
                  <span className="font-mono text-lg">{totalOrderCount}</span>
                  <span className={`text-[10px] ${t.textMuted}`}>orders</span>
                </div>
              </>
            ) : (
              <span className={`text-xs ${t.textFaint}`}>No orders yet</span>
            )}
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1.5 mt-2">
            {orderStatusCounts.map((s) => (
              <div key={s.status} className={`flex items-center gap-1.5 text-[11px] ${t.textSub}`}>
                <span
                  className="w-1.5 h-1.5 rounded-full"
                  style={{ background: t.mode === "dark" ? STATUS_COLORS[s.status]?.dark : STATUS_COLORS[s.status]?.light }}
                />
                {s.status.charAt(0) + s.status.slice(1).toLowerCase()} ({s.count})
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Orders + Best Sellers */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className={`border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${t.textSub}`}>Recent orders</span>
          </div>
          {recentOrders.length === 0 ? (
            <div className={`text-xs ${t.textFaint} py-6 text-center`}>No orders yet</div>
          ) : (
            <div className={`flex flex-col divide-y ${t.divide}`}>
              {recentOrders.map((o) => (
                <div key={o.id} className="flex items-center gap-3 py-2.5">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs">#{o.id}</span>
                      <span className="text-sm truncate">{o.customer}</span>
                    </div>
                    <span className={`text-[11px] ${t.textFaint}`}>{o.itemCount} items</span>
                  </div>
                  <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${STATUS_BADGES[o.status] || ""}`}>
                    {o.status}
                  </span>
                  <span className="font-mono text-xs">{currency(o.total)}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className={`border rounded-md p-4 ${t.panel}`}>
          <div className="flex items-center justify-between mb-3">
            <span className={`text-xs ${t.textSub}`}>Best selling products</span>
          </div>
          {bestSellingProducts.length === 0 ? (
            <div className={`text-xs ${t.textFaint} py-6 text-center`}>No sales data yet</div>
          ) : (
            <div className={`flex flex-col divide-y ${t.divide}`}>
              {bestSellingProducts.map((p, i) => (
                <div key={i} className="flex items-center gap-3 py-2.5">
                  <span className={`font-mono text-xs w-4 ${t.textFaint}`}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm truncate block">{p.name}</span>
                    <span className={`text-[11px] ${t.textMuted}`}>{p.totalSold} sold</span>
                  </div>
                  <div className={`w-24 h-1.5 rounded-full overflow-hidden ${t.trackBg}`}>
                    <div
                      className={`h-full rounded-full ${t.accentBarBg}`}
                      style={{ width: `${(p.totalSold / maxSold) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Recent Reviews */}
      <div className={`border rounded-md p-4 ${t.panel}`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-xs ${t.textSub}`}>Recent reviews</span>
          {stats.unreadNotifications > 0 && (
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${t.warningBadge}`}>
              {stats.unreadNotifications} unread notifications
            </span>
          )}
        </div>
        {recentReviews.length === 0 ? (
          <div className={`text-xs ${t.textFaint} py-6 text-center`}>No reviews yet</div>
        ) : (
          <div className={`flex flex-col divide-y ${t.divide}`}>
            {recentReviews.map((r) => (
              <div key={r.id} className="flex items-start gap-3 py-2.5">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm">{r.customer}</span>
                    <span className={`text-[11px] ${t.textFaint}`}>on {r.product}</span>
                  </div>
                  <StarRating rating={r.rating} />
                  {r.comment && <p className={`text-xs mt-1 ${t.textMuted}`}>{r.comment}</p>}
                </div>
                <div className="flex items-center gap-1 text-[11px] shrink-0">
                  <Clock size={11} className={t.textFaint} />
                  <span className={t.textFaint}>{new Date(r.date).toLocaleDateString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}