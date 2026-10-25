"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Spinner } from "@online-store/ui/spinner";

export default function LoginPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.status === "PENDING") {
          router.push("/status/pending");
          return;
        }
        setError(data.error);
        setLoading(false);
        return;
      }

      router.push("/dashboard/overview");
    } catch (err) {
      setError("Something went wrong");
      console.error(err);
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950 px-4">
      <Card className="w-full max-w-md p-8 shadow-2xl border border-fuchsia-100 dark:border-neutral-800">
        
        {/* Brand */}
        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold tracking-wide">
            GrowMore 
            <span className="ml-1 text-fuchsia-800 dark:text-fuchsia-600">Online Store</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Sign in to Vendor dashboard
          </p>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 rounded-md bg-red-50 dark:bg-red-900/20 px-4 py-2 text-sm text-red-600 dark:text-red-400 text-center">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          {/* Username */}
          <div className="space-y-1">
            <Label htmlFor="name">Username</Label>
            <Input
              id="name"
              type="text"
              placeholder="Enter your username"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="focus:ring-2 focus:ring-fuchsia-600"
              required
            />
          </div>

          {/* Password */}
          <div className="space-y-1">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="focus:ring-2 focus:ring-fuchsia-600"
              required
            />
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            variant="shoe"
            className="w-full h-11 text-base tracking-wide flex items-center justify-center gap-2"
            disabled={loading}
          >
            {loading && <Spinner className="h-5 w-5 text-white animate-spin" />}
            {loading ? "Signing In..." : "Sign In"}
          </Button>
        </form>

        {/* Footer */}
        <div className="mt-6 text-center text-xs text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} GrowMore Online Store. All rights reserved.
        </div>
      </Card>
    </div>
  );
}
