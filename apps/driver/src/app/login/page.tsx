"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Spinner } from "@online-store/ui/spinner";
import {
  AlertCircle,
  ArrowRight,
  Bike,
  Eye,
  EyeOff,
  Lock,
  MapPin,
  ShieldCheck,
  Store,
  TriangleAlert,
  UserRound,
  Zap,
} from "lucide-react";

const ROUTE = "M40 250 C 130 250, 110 150, 200 150 S 290 70, 360 50";

function getGreeting(date = new Date()) {
  const h = date.getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

export default function DriverLoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [error, setError] = useState("");
  const [errorKey, setErrorKey] = useState(0); // retriggers the shake animation
  const [loading, setLoading] = useState(false);
  const [greeting, setGreeting] = useState("Welcome back");

  useEffect(() => {
    setGreeting(getGreeting());
  }, []);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

  const fail = (message: string) => {
    setError(message);
    setErrorKey((k) => k + 1);
    setLoading(false);
  };

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    if (loading) return;
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: username.trim(),
        password,
        redirect: false,
      });

      if (!res || res.error) {
        fail("Invalid username or password. Check the login given by the admin.");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      fail("Something went wrong. Please try again.");
    }
  };

  const inputClass =
    "h-12 rounded-xl border-gray-200 bg-white/80 pl-11 text-[15px] text-gray-900 placeholder:text-gray-400 transition focus-visible:border-fuchsia-500 focus-visible:bg-white focus-visible:ring-4 focus-visible:ring-fuchsia-500/15 dark:border-white/10 dark:bg-gray-950/70 dark:text-white dark:placeholder:text-gray-500 dark:focus-visible:bg-gray-950";

  return (
    <main className="grid min-h-screen bg-white lg:grid-cols-[1.05fr_1fr] dark:bg-gray-950">
      {/* Local keyframes (respect reduced motion) */}
      <style>{`
        @keyframes gm-dash { to { stroke-dashoffset: -48; } }
        @keyframes gm-float { 0%,100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }
        @keyframes gm-ping { 0% { transform: scale(1); opacity: .55; } 100% { transform: scale(2.6); opacity: 0; } }
        @keyframes gm-shake { 0%,100% { transform: translateX(0); } 20% { transform: translateX(-6px); } 40% { transform: translateX(6px); } 60% { transform: translateX(-4px); } 80% { transform: translateX(4px); } }
        @keyframes gm-rise { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        .gm-dash { stroke-dasharray: 8 16; animation: gm-dash 1.4s linear infinite; }
        .gm-float { animation: gm-float 6s ease-in-out infinite; }
        .gm-float-slow { animation: gm-float 8s ease-in-out infinite reverse; }
        .gm-ping { transform-box: fill-box; transform-origin: center; animation: gm-ping 2s ease-out infinite; }
        .gm-shake { animation: gm-shake .45s ease-in-out; }
        .gm-rise { opacity: 0; animation: gm-rise .6s cubic-bezier(.2,.8,.2,1) forwards; }
        @media (prefers-reduced-motion: reduce) {
          .gm-dash, .gm-float, .gm-float-slow, .gm-ping, .gm-shake, .gm-rise { animation: none !important; opacity: 1; }
        }
      `}</style>

      {/* ───────────── Brand / route panel ───────────── */}
      <section
        aria-hidden
        className="relative hidden overflow-hidden bg-gradient-to-br from-fuchsia-600 via-fuchsia-700 to-purple-900 text-white lg:flex lg:flex-col lg:justify-between lg:p-12"
      >
        {/* dotted grid + glows */}
        <div
          className="absolute inset-0 opacity-[0.18]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1px 1px, white 1px, transparent 0)",
            backgroundSize: "26px 26px",
          }}
        />
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl" />
        <div className="absolute -bottom-32 -right-24 h-[28rem] w-[28rem] rounded-full bg-purple-400/30 blur-3xl" />

        {/* logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/15 ring-1 ring-white/30 backdrop-blur">
            <Bike className="h-6 w-6" />
          </div>
          <span className="text-lg font-semibold tracking-tight">
            GrowMore <span className="text-fuchsia-200">Driver</span>
          </span>
        </div>

        {/* animated route */}
        <div className="relative mx-auto my-8 w-full max-w-[460px]">
          <svg viewBox="0 0 400 300" className="w-full drop-shadow-2xl">
            {/* soft route shadow */}
            <path
              d={ROUTE}
              fill="none"
              stroke="rgba(255,255,255,.12)"
              strokeWidth="14"
              strokeLinecap="round"
            />
            {/* animated dashed route */}
            <path
              d={ROUTE}
              fill="none"
              stroke="white"
              strokeWidth="3.5"
              strokeLinecap="round"
              className="gm-dash"
            />

            {/* store pin */}
            <g transform="translate(40 250)">
              <circle r="22" fill="white" opacity=".15" className="gm-ping" />
              <circle r="15" fill="white" />
              <circle r="6" fill="#a21caf" />
            </g>

            {/* customer pin */}
            <g transform="translate(360 50)">
              <circle r="22" fill="#fde68a" opacity=".3" className="gm-ping" />
              <circle r="15" fill="#fde68a" />
              <circle r="6" fill="#c026d3" />
            </g>

            {/* rider moving along the route */}
            <g>
              <circle r="20" fill="white" opacity=".2" />
              <circle r="12" fill="white" stroke="#a21caf" strokeWidth="3" />
              <circle r="4" fill="#a21caf" />
              <animateMotion
                dur="7s"
                repeatCount="indefinite"
                path={ROUTE}
                keyPoints="0;1;1"
                keyTimes="0;0.9;1"
                calcMode="linear"
              />
            </g>
          </svg>

          {/* floating info chips */}
          <div className="gm-float absolute -left-2 top-4 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-fuchsia-700">
              <Store className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] uppercase tracking-wider text-fuchsia-100">
                Pickup
              </span>
              <span className="font-semibold">Order ready</span>
            </span>
          </div>

          <div className="gm-float-slow absolute -right-2 bottom-6 flex items-center gap-2 rounded-2xl border border-white/20 bg-white/15 px-3.5 py-2.5 text-sm shadow-xl backdrop-blur-md">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-200 text-fuchsia-800">
              <MapPin className="h-4 w-4" />
            </span>
            <span className="leading-tight">
              <span className="block text-[11px] uppercase tracking-wider text-fuchsia-100">
                Drop-off
              </span>
              <span className="font-semibold">ETA 12 min</span>
            </span>
          </div>
        </div>

        {/* tagline */}
        <div className="relative max-w-md">
          <h2 className="text-3xl font-bold leading-tight tracking-tight">
            Every delivery,
            <br />
            one tap closer.
          </h2>
          <p className="mt-3 text-sm text-fuchsia-100/90">
            See your orders, follow the route, and keep customers updated — all
            from one place.
          </p>
        </div>
      </section>

      {/* ───────────── Form panel ───────────── */}
      <section className="relative flex items-center justify-center overflow-hidden px-5 py-10 sm:px-10">
        {/* mobile-only background glow */}
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
              <Bike className="h-8 w-8" />
            </div>
            <span className="text-lg font-semibold tracking-tight text-gray-900 dark:text-white">
              GrowMore{" "}
              <span className="text-fuchsia-700 dark:text-fuchsia-400">
                Driver
              </span>
            </span>
          </div>

          {/* heading */}
          <div className="mb-8 text-center lg:text-left">
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full border border-fuchsia-200 bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700 dark:border-fuchsia-500/30 dark:bg-fuchsia-500/10 dark:text-fuchsia-300">
              <Zap className="h-3.5 w-3.5" />
              Driver portal
            </span>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">
              {greeting} <span aria-hidden>👋</span>
            </h1>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Sign in with the username and password from your admin.
            </p>
          </div>

          {/* card */}
          <div
            key={errorKey}
            className={`rounded-3xl border border-fuchsia-100 bg-white/80 p-6 shadow-2xl shadow-fuchsia-100/70 backdrop-blur sm:p-8 dark:border-white/10 dark:bg-gray-900/70 dark:shadow-black/40 ${
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
              {/* username */}
              <div className="space-y-2">
                <Label
                  htmlFor="username"
                  className="text-sm font-medium text-gray-700 dark:text-gray-200"
                >
                  Username
                </Label>
                <div className="group relative">
                  <UserRound className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 transition group-focus-within:text-fuchsia-600 dark:text-gray-500 dark:group-focus-within:text-fuchsia-400" />
                  <Input
                    id="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="e.g. kasun4821"
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

              {/* password */}
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
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyUp={(e) =>
                      setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                    }
                    onKeyDown={(e) =>
                      setCapsLock(e.getModifierState?.("CapsLock") ?? false)
                    }
                    onBlur={() => setCapsLock(false)}
                    placeholder="Enter your password"
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

              <Button
                type="submit"
                disabled={loading || !username || !password}
                className="group h-12 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 via-fuchsia-600 to-purple-700 text-base font-semibold text-white shadow-lg shadow-fuchsia-300/60 transition hover:shadow-xl hover:shadow-fuchsia-300/70 active:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60 disabled:shadow-none dark:shadow-fuchsia-900/40"
              >
                {loading ? (
                  <>
                    <Spinner className="mr-2 h-5 w-5 animate-spin text-white" />
                    Signing in...
                  </>
                ) : (
                  <>
                    Start my shift
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </>
                )}
              </Button>
            </form>
          </div>

          <p className="mt-6 flex items-center justify-center gap-1.5 text-center text-xs text-gray-400 dark:text-gray-500 lg:justify-start">
            <ShieldCheck className="h-3.5 w-3.5" />
            Need a login? Contact the store administrator.
          </p>
        </div>
      </section>
    </main>
  );
}