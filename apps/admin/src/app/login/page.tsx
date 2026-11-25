"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Spinner } from "@online-store/ui/spinner";
import {
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  LayoutDashboard,
  Lock,
  Package,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  TriangleAlert,
  UserRound,
} from "lucide-react";

const BARS = [38, 55, 44, 70, 52, 86, 64];
const DAYS = ["M", "T", "W", "T", "F", "S", "S"];

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
      const res = await signIn("credentials", {
        email: name.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        fail("Invalid username or password");
        return;
      }

      router.push("/dashboard/overview");
      router.refresh();
    } catch (err) {
      console.error(err);
      fail("Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "h-12 rounded-xl border-gray-200 bg-white/80 pl-11 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus-visible:border-fuchsia-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-fuchsia-500/15 dark:border-white/10 dark:bg-neutral-950/70 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:bg-neutral-950";

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr] dark:bg-neutral-950">
      <style>{`
        @keyframes gm-bar { from { transform: scaleY(0); } to { transform: scaleY(1); } }
        @keyframes gm-draw { from { stroke-dashoffset: 1; } to { stroke-dashoffset: 0; } }
        @keyframes gm-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes gm-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes gm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .gm-bar { transform-origin: bottom; transform: scaleY(0); animation: gm-bar .9s cubic-bezier(.2,.8,.2,1) forwards; }
        .gm-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: gm-draw 1.8s ease-out .5s forwards; }
        .gm-float { animation: gm-float 6s ease-in-out infinite; }
        .gm-float-slow { animation: gm-float 8s ease-in-out infinite reverse; }
        .gm-shake { animation: gm-shake .45s ease-in-out; }
        .gm-rise { opacity: 0; animation: gm-rise .6s cubic-bezier(.2,.8,.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .gm-bar { animation: none !important; transform: scaleY(1); }
          .gm-draw { animation: none !important; stroke-dashoffset: 0; }
          .gm-float, .gm-float-slow, .gm-shake { animation: none !important; }
          .gm-rise { animation: none !important; opacity: 1; }
        }
      `}</style>

      {/* ───────────── Brand / dashboard preview panel ───────────── */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-gradient-to-br from-fuchsia-700 via-fuchsia-800 to-purple-950 text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        <div
          className="absolute inset-0 opacity-[0.16]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-400/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-purple-400/25 blur-3xl" />

        {/* logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <ShoppingBag className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            GrowMore <span className="text-fuchsia-200">Online Store</span>
          </span>
        </div>

        {/* dashboard mock */}
        <div className="relative mx-auto my-8 w-full max-w-[440px]">
          <div className="rounded-3xl border border-white/20 bg-white/10 p-5 shadow-2xl backdrop-blur-md">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-fuchsia-100">
                  This week
                </p>
                <p className="text-2xl font-bold">Sales overview</p>
              </div>
              <span className="flex items-center gap-1 rounded-full bg-emerald-400/20 px-2.5 py-1 text-xs font-semibold text-emerald-200">
                <TrendingUp className="h-3.5 w-3.5" />
                +18%
              </span>
            </div>

            {/* bars */}
            <div className="relative flex h-40 items-end gap-2.5">
              {BARS.map((h, i) => (
                <div key={i} className="flex h-full flex-1 flex-col justify-end">
                  <div
                    className={`gm-bar w-full rounded-t-lg ${
                      i === 5
                        ? "bg-gradient-to-t from-amber-300 to-amber-100"
                        : "bg-gradient-to-t from-white/40 to-white/80"
                    }`}
                    style={{ height: `${h}%`, animationDelay: `${i * 90}ms` }}
                  />
                </div>
              ))}
              {/* sparkline overlay */}
              <svg
                viewBox="0 0 100 40"
                preserveAspectRatio="none"
                className="pointer-events-none absolute inset-0 h-full w-full"
              >
                <path
                  d="M 4 28 C 14 22, 20 24, 28 20 S 44 26, 52 16 S 68 6, 78 10 S 92 4, 97 3"
                  fill="none"
                  stroke="#fde68a"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                  pathLength={1}
                  className="gm-draw"
                  vectorEffect="non-scaling-stroke"
                />
              </svg>
            </div>
            <div className="mt-2 flex gap-2.5">
              {DAYS.map((d, i) => (
                <span
                  key={i}
                  className="flex-1 text-center text-[11px] text-fuchsia-100/80"
                >
                  {d}
                </span>
              ))}
            </div>
          </div>

          {/* floating chips */}
          <div className="gm-float absolute -left-6 -top-5 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
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

          <div className="gm-float-slow absolute -bottom-6 -right-6 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 text-fuchsia-800">
              <LayoutDashboard className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] uppercase tracking-wider text-fuchsia-100">
                Store status
              </span>
              <span className="font-semibold">All systems live</span>
            </span>
          </div>
        </div>

        {/* tagline */}
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Run your store
            <br />
            with confidence.
          </h2>
          <p className="mt-3 text-sm text-fuchsia-100/90">
            Orders, products, drivers and sales — everything you need in one
            admin dashboard.
          </p>
        </div>
      </section>

      {/* ───────────── Form panel ───────────── */}
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        <div
          aria-hidden
          className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-fuchsia-300/30 blur-3xl lg:hidden dark:bg-fuchsia-600/20"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-purple-300/30 blur-3xl lg:hidden dark:bg-purple-600/10"
        />

        <div className="gm-rise relative w-full max-w-md">
          {/* mobile logo */}
          <div className="mb-8 flex flex-col items-center text-center lg:hidden">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-lg shadow-fuchsia-300/50 ring-4 ring-fuchsia-100 dark:shadow-fuchsia-900/50 dark:ring-fuchsia-500/10">
              <ShoppingBag className="h-8 w-8" />
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
              Admin dashboard
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {greeting} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in to manage your store.
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
                className="group h-12 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-fuchsia-700 to-purple-800 text-base font-semibold tracking-wide text-white shadow-lg shadow-fuchsia-300/60 transition hover:shadow-xl hover:shadow-fuchsia-300/70 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:shadow-fuchsia-900/40"
              >
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
    </main>
  );
}