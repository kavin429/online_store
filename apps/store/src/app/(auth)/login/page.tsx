// app/login/page.tsx
"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { User, Lock, ShoppingBag, Truck, ShieldCheck } from "lucide-react";
import { FcGoogle } from "react-icons/fc";
import { toast } from "sonner";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { useState } from "react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const handleLogin = async () => {
    if (!email || !password) {
      toast.error("Please enter both email and password");
      return;
    }

    setLoading(true);
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        toast.error("Invalid email or password");
        return;
      }

      if (result?.ok) {
        setTimeout(() => {
          const separator = callbackUrl.includes("?") ? "&" : "?";
          router.push(`${callbackUrl}${separator}loggedIn=1`);
          router.refresh();
        }, 1000);
      }
    } catch (error) {
      console.error(error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center px-4 py-6 overflow-hidden bg-[#eef0fb] dark:bg-zinc-950 transition-colors">
      {/* Background blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-24 -left-16 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-fuchsia-300/50 dark:bg-fuchsia-700/25 blur-3xl" />
        <div className="absolute top-10 right-0 w-60 h-60 sm:w-80 sm:h-80 rounded-full bg-violet-300/50 dark:bg-violet-800/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/4 w-72 h-72 sm:w-96 sm:h-96 rounded-full bg-pink-300/40 dark:bg-fuchsia-900/25 blur-3xl" />
        <div className="absolute bottom-10 right-10 w-56 h-56 sm:w-72 sm:h-72 rounded-full bg-purple-300/40 dark:bg-purple-900/20 blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="
          relative
          w-full
          max-w-3xl
          rounded-xl
          overflow-hidden
          border border-white/40 dark:border-fuchsia-900/30
          shadow-[0_8px_40px_rgba(168,85,247,0.2)] dark:shadow-[0_8px_40px_rgba(0,0,0,0.5)]
          bg-white/40 dark:bg-zinc-900/60
          backdrop-blur-2xl
        "
      >
        <div className="grid md:grid-cols-2 h-full">
          {/* LEFT SIDE */}
          <div className="flex flex-col justify-center px-6 py-6 sm:px-10 sm:py-7 md:px-12 relative z-10">
            <h1 className="text-xl sm:text-2xl font-bold text-zinc-800 dark:text-zinc-100 mb-1 text-center sm:text-left">
              Welcome back
            </h1>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 mb-4 text-center sm:text-left">
              Log in to pick up your cart where you left off.
            </p>

            {/* EMAIL */}
            <div className="relative mb-3">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 h-4 w-4" />
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="
                  w-full
                  bg-white/60 dark:bg-zinc-800/60
                  border border-white/60 dark:border-fuchsia-900/40
                  rounded-full
                  pl-11 pr-4 py-2.5
                  text-sm text-zinc-700 dark:text-zinc-200
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  outline-none
                  focus:border-fuchsia-400 dark:focus:border-fuchsia-600 focus:bg-white/80 dark:focus:bg-zinc-800
                  transition-all
                "
              />
            </div>

            {/* PASSWORD */}
            <div className="relative mb-2">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500 h-4 w-4" />
              <input
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                className="
                  w-full
                  bg-white/60 dark:bg-zinc-800/60
                  border border-white/60 dark:border-fuchsia-900/40
                  rounded-full
                  pl-11 pr-4 py-2.5
                  text-sm text-zinc-700 dark:text-zinc-200
                  placeholder:text-zinc-400 dark:placeholder:text-zinc-500
                  outline-none
                  focus:border-fuchsia-400 dark:focus:border-fuchsia-600 focus:bg-white/80 dark:focus:bg-zinc-800
                  transition-all
                "
              />
            </div>

            <div className="text-right mb-4">
              <Link
                href="/forgot-password"
                className="text-xs text-zinc-500 dark:text-zinc-400 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 transition-colors"
              >
                Forgot password?
              </Link>
            </div>

            {/* LOGIN BUTTON */}
            <Button
              variant="shoe"
              className="mb-2"
              onClick={handleLogin}
              disabled={loading}
            >
              {loading ? "Logging in..." : "Log In"}
            </Button>

            {/* DIVIDER */}
            <div className="flex items-center gap-3 mb-4">
              <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
              <span className="text-zinc-400 dark:text-zinc-500 text-xs">OR</span>
              <div className="h-px flex-1 bg-zinc-300 dark:bg-zinc-700" />
            </div>

            {/* GOOGLE LOGIN */}
            <Button
              variant="outline"
              onClick={() => signIn("google", { callbackUrl: `${callbackUrl}?loggedIn=1` })}
              className="
                h-11
                rounded-full
                border border-white/60 dark:border-zinc-700
                bg-white/50 dark:bg-zinc-800/50
                hover:bg-white/70 dark:hover:bg-zinc-800
                text-zinc-700 dark:text-zinc-200
                flex
                gap-3
                transition-all
              "
            >
              <FcGoogle className="h-5 w-5" />
              <span className="font-medium text-sm">
                Continue with Google
              </span>
            </Button>

            {/* SIGNUP */}
            <p className="mt-5 text-zinc-500 dark:text-zinc-400 text-sm text-center">
              New to GrowMore?{" "}
              <Link
                href="/signup"
                className="text-fuchsia-600 dark:text-fuchsia-400 font-semibold hover:text-fuchsia-700 dark:hover:text-fuchsia-300"
              >
                Create an account
              </Link>
            </p>
          </div>

          {/* RIGHT SIDE */}
          <div className="hidden md:flex items-center justify-center relative overflow-hidden p-5">
            <div
              className="
                relative z-10 w-full h-full rounded-lg
                bg-gradient-to-br from-fuchsia-600/40 via-purple-500/40 to-fuchsia-900/40
                dark:from-fuchsia-900/50 dark:via-purple-900/40 dark:to-zinc-900/60
                backdrop-blur-md border border-white/40 dark:border-fuchsia-800/30
                flex flex-col justify-center px-7
                shadow-lg
              "
            >
              <h2 className="text-2xl font-bold text-white leading-tight drop-shadow-sm">
                Your next pair
                <br />
                is waiting.
              </h2>

              <p className="mt-3 text-white/90 text-sm leading-6 drop-shadow-sm">
                Sign in for faster checkout, order tracking, and
                offers picked just for you.
              </p>

              <div className="flex flex-col gap-2.5 mt-5">
                <div className="flex items-center gap-2 text-white/85 text-xs">
                  <Truck className="h-4 w-4 shrink-0" />
                  <span>Fast delivery on every order</span>
                </div>
                <div className="flex items-center gap-2 text-white/85 text-xs">
                  <ShieldCheck className="h-4 w-4 shrink-0" />
                  <span>Secure payments, always</span>
                </div>
                <div className="flex items-center gap-2 text-white/85 text-xs">
                  <ShoppingBag className="h-4 w-4 shrink-0" />
                  <span>Track orders in real time</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}