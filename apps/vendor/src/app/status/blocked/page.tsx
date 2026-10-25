"use client";

import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Ban, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function BlockedPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-2xl border border-fuchsia-100 dark:border-neutral-800 text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
        <Ban className="w-8 h-8 text-red-600 dark:text-red-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Account Blocked</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your account has been blocked. Please contact support for more information.
        </p>
      </div>

      <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
        <p className="text-sm text-red-700 dark:text-red-300">
          If you believe this is an error, please reach out to our support team.
        </p>
      </div>

      <Button variant="outline" onClick={handleLogout} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </Card>
  );
}
