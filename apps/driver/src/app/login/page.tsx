"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Spinner } from "@online-store/ui/spinner";
import { Bike, Lock, UserRound } from "lucide-react";

export default function DriverLoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (event: React.FormEvent) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await signIn("credentials", {
        email: username,
        password,
        redirect: false,
      });

      if (!res || res.error) {
        setError("Invalid username or password. Check the login given by the admin.");
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
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-50 to-gray-100 px-4">
      <Card className="w-full max-w-md border border-fuchsia-100 p-8 shadow-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-200">
            <Bike className="h-7 w-7" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">
            GrowMore <span className="text-fuchsia-700">Driver</span>
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Sign in with the username and password from your admin.
          </p>
        </div>

        {error && (
          <div className="mb-4 rounded-md bg-red-50 px-4 py-2 text-center text-sm text-red-600">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-1.5">
            <Label htmlFor="username">Username</Label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. kasun4821"
                className="pl-9"
                autoComplete="username"
                required
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="pl-9"
                autoComplete="current-password"
                required
              />
            </div>
          </div>

          <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
            {loading && <Spinner className="mr-2 h-5 w-5 animate-spin text-white" />}
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <p className="mt-6 text-center text-xs text-gray-400">
          Need a login? Contact the store administrator.
        </p>
      </Card>
    </div>
  );
}
