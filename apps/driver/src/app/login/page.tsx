"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { signIn, useSession } from "next-auth/react";
import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Spinner } from "@online-store/ui/spinner";
import {
  AlertCircle,
  Bike,
  Eye,
  EyeOff,
  Lock,
  UserRound,
} from "lucide-react";

export default function DriverLoginPage() {
  const router = useRouter();
  const { status } = useSession();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") router.replace("/dashboard");
  }, [status, router]);

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
        setError(
          "Invalid username or password. Check the login given by the admin."
        );
        setLoading(false);
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } catch (err) {
      console.error(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-fuchsia-50 via-white to-gray-100 px-4 py-10 transition-colors dark:from-gray-950 dark:via-gray-950 dark:to-fuchsia-950/40">
      {/* Decorative background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 -right-32 h-96 w-96 rounded-full bg-fuchsia-300/30 blur-3xl dark:bg-fuchsia-600/20"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-purple-300/30 blur-3xl dark:bg-purple-600/10"
      />

      <Card className="relative w-full max-w-md rounded-3xl border border-fuchsia-100 bg-white/90 p-8 shadow-2xl shadow-fuchsia-100/60 backdrop-blur sm:p-10 dark:border-white/10 dark:bg-gray-900/80 dark:shadow-black/40">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-lg shadow-fuchsia-300/50 ring-4 ring-fuchsia-100 dark:shadow-fuchsia-900/50 dark:ring-fuchsia-500/10">
            <Bike className="h-8 w-8" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">
            GrowMore{" "}
            <span className="text-fuchsia-700 dark:text-fuchsia-400">
              Driver
            </span>
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sign in with the username and password from your admin.
          </p>
        </div>

        {/* Error */}
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

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5" noValidate={false}>
          <div className="space-y-2">
            <Label
              htmlFor="username"
              className="text-gray-700 dark:text-gray-200"
            >
              Username
            </Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kasun4821"
                className="h-11 rounded-xl border-gray-200 bg-white pl-10 text-gray-900 placeholder:text-gray-400 focus-visible:border-fuchsia-500 focus-visible:ring-2 focus-visible:ring-fuchsia-500/30 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
                autoComplete="username"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                disabled={loading}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="password"
              className="text-gray-700 dark:text-gray-200"
            >
              Password
            </Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="h-11 rounded-xl border-gray-200 bg-white pl-10 pr-11 text-gray-900 placeholder:text-gray-400 focus-visible:border-fuchsia-500 focus-visible:ring-2 focus-visible:ring-fuchsia-500/30 dark:border-white/10 dark:bg-gray-950 dark:text-white dark:placeholder:text-gray-500"
                autoComplete="current-password"
                disabled={loading}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                aria-pressed={showPassword}
                tabIndex={0}
                className="absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500/40 dark:hover:bg-white/10 dark:hover:text-gray-200"
              >
                {showPassword ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </button>
            </div>
          </div>

          <Button
            type="submit"
            disabled={loading || !username || !password}
            className="h-12 w-full rounded-xl bg-gradient-to-r from-fuchsia-600 to-fuchsia-700 text-base font-semibold text-white shadow-lg shadow-fuchsia-300/50 transition hover:from-fuchsia-700 hover:to-fuchsia-800 hover:shadow-xl active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60 dark:shadow-fuchsia-900/40"
          >
            {loading && (
              <Spinner className="mr-2 h-5 w-5 animate-spin text-white" />
            )}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-8 text-center text-xs text-gray-400 dark:text-gray-500">
          Need a login? Contact the store administrator.
        </p>
      </Card>
    </main>
  );
}