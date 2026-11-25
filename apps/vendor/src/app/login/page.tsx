"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Spinner } from "@online-store/ui/spinner";
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Lock,
  Package,
  ShieldCheck,
  Sparkles,
  Store,
  TriangleAlert,
  Truck,
  UserRound,
  Wallet,
} from "lucide-react";

const ORDERS = [
  {
    id: "#1042",
    meta: "3 items · Rs 4,200",
    label: "Packing",
    icon: Package,
    pill: "bg-amber-300/25 text-amber-100",
    delay: 400,
  },
  {
    id: "#1041",
    meta: "1 item · Rs 1,850",
    label: "On the way",
    icon: Truck,
    pill: "bg-sky-300/25 text-sky-100",
    delay: 650,
  },
  {
    id: "#1040",
    meta: "5 items · Rs 7,600",
    label: "Delivered",
    icon: CheckCircle2,
    pill: "bg-emerald-300/25 text-emerald-100",
    delay: 900,
  },
];

function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0); // retriggers the shake
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  const fail = (message: string) => {
    setError(message);
    setErrorKey((k) => k + 1);
    setLoading(false);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === "PENDING") {
          router.push("/status/pending");
          return;
        }
        fail(data.error || "Invalid username or password");
        return;
      }

      router.push("/dashboard/overview");
    } catch (err) {
      console.error(err);
      fail("Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "h-12 rounded-xl border-gray-200 bg-white/80 pl-11 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus-visible:border-fuchsia-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-fuchsia-500/15 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:bg-neutral-950";

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1fr_1.05fr] dark:bg-neutral-950">
      <style>{`
        @keyframes gm-ring { from { stroke-dashoffset: 327; } to { stroke-dashoffset: 72; } }
        @keyframes gm-slide { from { opacity: 0; transform: translateX(28px); } to { opacity: 1; transform: translateX(0); } }
        @keyframes gm-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes gm-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes gm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes gm-shine { 0% { transform: translateX(-120%); } 60%,100% { transform: translateX(220%); } }
        .gm-ring { stroke-dasharray: 327; stroke-dashoffset: 327; animation: gm-ring 1.6s cubic-bezier(.2,.8,.2,1) .3s forwards; }
        .gm-slide { opacity: 0; animation: gm-slide .6s cubic-bezier(.2,.8,.2,1) forwards; }
        .gm-float { animation: gm-float 6s ease-in-out infinite; }
        .gm-float-slow { animation: gm-float 8s ease-in-out infinite reverse; }
        .gm-shake { animation: gm-shake .45s ease-in-out; }
        .gm-rise { opacity: 0; animation: gm-rise .6s cubic-bezier(.2,.8,.2,1) forwards; }
        .gm-shine { animation: gm-shine 4.5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .gm-ring { animation: none !important; stroke-dashoffset: 72; }
          .gm-slide, .gm-rise { animation: none !important; opacity: 1; }
          .gm-float, .gm-float-slow, .gm-shake, .gm-shine { animation: none !important; }
        }
      `}</style>

      {/* ───────────── Form panel (left) ───────────── */}
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -left-24 -top-24 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-600/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -right-24 h-72 w-72 rounded-full bg-rose-200/40 blur-3xl lg:hidden dark:bg-rose-500/10"
        />

        <div className="gm-rise relative w-full max-w-md">
          {/* logo */}
          <div className="mb-8 flex items-center justify-center gap-3 lg:justify-start">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-lg shadow-fuchsia-300/50 ring-4 ring-fuchsia-100 dark:shadow-fuchsia-900/50 dark:ring-fuchsia-500/10">
              <Store className="h-6 w-6" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              GrowMore{" "}
              <span className="text-fuchsia-800 dark:text-fuchsia-500">
                Online Store
              </span>
            </span>
          </div>

          {/* heading */}
          <div className="mb-8 text-center lg:text-left">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
              <ShieldCheck className="h-3.5 w-3.5" />
              Vendor dashboard
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {greeting} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to manage your shop.
            </p>
          </div>

          {/* card */}
          <div
            key={errorKey}
            className={`rounded-3xl border border-fuchsia-100 bg-white/80 p-6 shadow-2xl shadow-fuchsia-100/70 backdrop-blur sm:p-8 dark:border-white/10 dark:bg-neutral-900/70 dark:shadow-black/40 ${
              error ? "gm-shake" : ""
            }`}
          >
            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="mb-5 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/30 dark:bg-red-500/10 dark:text-red-300"
              >
                <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              {/* Username */}
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Username
                </Label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-fuchsia-600 dark:text-gray-500 dark:group-focus-within:text-fuchsia-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter your username"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className={inputClass}
                    autoComplete="username"
                    autoCapitalize="none"
                    autoCorrect="off"
                    spellCheck={false}
                    disabled={loading}
                    autoFocus
                    required
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label
                  htmlFor="password"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Password
                </Label>
                <div className="group relative">
                  <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-fuchsia-600 dark:text-gray-500 dark:group-focus-within:text-fuchsia-400" />
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={(e) =>
                      setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                    }
                    onKeyUp={(e) =>
                      setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                    }
                    onBlur={() => setCapsLock(false)}
                    className={`${inputClass} pr-12`}
                    autoComplete="current-password"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={
                      showPassword ? "Hide password" : "Show password"
                    }
                    aria-pressed={showPassword}
                    className="absolute right-2 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-fuchsia-50 hover:text-fuchsia-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 dark:hover:bg-white/10 dark:hover:text-fuchsia-300"
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>

                {capsLock && (
                  <p className="flex items-center gap-1.5 text-xs font-medium text-amber-600 dark:text-amber-400">
                    <TriangleAlert className="h-3.5 w-3.5" />
                    Caps Lock is on
                  </p>
                )}
              </div>

              {/* Submit */}
              <Button
                type="submit"
                disabled={loading || !name || !password}
                className="group relative h-12 w-full overflow-hidden rounded-xl bg-gradient-to-r from-fuchsia-600 via-fuchsia-700 to-rose-600 text-base font-semibold tracking-wide text-white shadow-lg shadow-fuchsia-300/60 transition hover:shadow-xl hover:shadow-fuchsia-300/70 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:shadow-fuchsia-900/40"
              >
                {/* subtle shine sweep */}
                <span
                  aria-hidden
                  className="gm-shine pointer-events-none absolute inset-y-0 left-0 w-1/3 -skew-x-12 bg-white/20"
                />
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-5 w-5 animate-spin text-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Sign in to dashboard
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 text-center text-xs text-gray-400 dark:text-gray-500 lg:text-left">
            © {new Date().getFullYear()} GrowMore Online Store. All rights
            reserved.
          </p>
        </div>
      </section>

      {/* ───────────── Orders & earnings panel (right) ───────────── */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-gradient-to-br from-fuchsia-600 via-fuchsia-800 to-rose-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-rose-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -left-24 h-[28rem] w-[28rem] rounded-full bg-fuchsia-400/25 blur-3xl" />

        {/* top badge */}
        <div className="relative flex justify-end">
          <span className="inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
            <Sparkles className="h-4 w-4 text-amber-200" />
            Trusted by GrowMore vendors
          </span>
        </div>

        {/* earnings + orders */}
        <div className="relative mx-auto my-8 w-full max-w-[440px]">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            {/* earnings ring */}
            <div className="flex items-center gap-5">
              <div className="relative h-32 w-32 shrink-0">
                <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90">
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="rgba(255,255,255,.18)"
                    strokeWidth="10"
                  />
                  <circle
                    cx="60"
                    cy="60"
                    r="52"
                    fill="none"
                    stroke="#fde68a"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="gm-ring"
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold">78%</span>
                  <span className="text-[10px] uppercase tracking-wider text-fuchsia-100">
                    daily goal
                  </span>
                </div>
              </div>
              <div>
                <p className="text-[11px] uppercase tracking-wider text-fuchsia-100">
                  Earned today
                </p>
                <p className="text-3xl font-bold">Rs 24,500</p>
                <p className="mt-1 text-xs text-emerald-200">
                  ↑ 18% vs yesterday
                </p>
              </div>
            </div>

            <div className="my-5 h-px bg-white/15" />

            {/* orders list */}
            <p className="mb-3 text-[11px] uppercase tracking-wider text-fuchsia-100">
              Latest orders
            </p>
            <ul className="space-y-2.5">
              {ORDERS.map((o) => {
                const Icon = o.icon;
                return (
                  <li
                    key={o.id}
                    className="gm-slide flex items-center justify-between rounded-2xl bg-white/10 px-3.5 py-3 ring-1 ring-white/10"
                    style={{ animationDelay: `${o.delay}ms` }}
                  >
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/90 text-fuchsia-700">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="leading-tight">
                        <span className="block text-sm font-semibold">
                          {o.id}
                        </span>
                        <span className="text-xs text-fuchsia-100/80">
                          {o.meta}
                        </span>
                      </span>
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${o.pill}`}
                    >
                      {o.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* floating chips */}
          <div className="gm-float absolute -left-8 -top-5 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 text-fuchsia-800">
              <Wallet className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] uppercase tracking-wider text-fuchsia-100">
                Payout
              </span>
              <span className="font-semibold">Ready</span>
            </span>
          </div>

          <div className="gm-float-slow absolute -bottom-6 -right-6 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-fuchsia-700">
              <Package className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] uppercase tracking-wider text-fuchsia-100">
                New orders
              </span>
              <span className="font-semibold">24 today</span>
            </span>
          </div>
        </div>

        {/* tagline */}
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Grow your shop
            <br />
            every single day.
          </h2>
          <p className="mt-3 text-sm text-fuchsia-100/90">
            Manage products, track orders and watch your earnings grow — all in
            one vendor dashboard.
          </p>
        </div>
      </section>
    </main>
  );
}