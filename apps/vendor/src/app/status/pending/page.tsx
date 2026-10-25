"use client";

import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { Clock, LogOut } from "lucide-react";
import { useRouter } from "next/navigation";

export default function PendingPage() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  };

  return (
    <Card className="w-full max-w-md p-8 shadow-2xl border border-fuchsia-100 dark:border-neutral-800 text-center space-y-6">
      <div className="mx-auto w-16 h-16 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
        <Clock className="w-8 h-8 text-yellow-600 dark:text-yellow-400" />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold">Verification Pending</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Your verification is pending. Your account will be active within 24 hours.
          Please check back later.
        </p>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4">
        <p className="text-sm text-yellow-700 dark:text-yellow-300">
          You will have full access to all features once your account is verified and activated.
        </p>
      </div>

      <Button variant="outline" onClick={handleLogout} className="w-full">
        <LogOut className="w-4 h-4 mr-2" />
        Logout
      </Button>
    </Card>
  );
}
