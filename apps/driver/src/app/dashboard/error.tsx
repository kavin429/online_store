"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[driver] dashboard error", error);
  }, [error]);

  return (
    <Card className="mx-auto max-w-lg space-y-4 p-8 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-red-600 dark:bg-red-950/50 dark:text-red-300">
        <AlertTriangle className="h-6 w-6" />
      </span>
      <div>
        <h1 className="text-lg font-semibold">We couldn&apos;t load this page</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Check your connection and try again. Your jobs are safe.
        </p>
      </div>
      <Button onClick={reset}>
        <RefreshCw className="mr-2 h-4 w-4" /> Try again
      </Button>
    </Card>
  );
}
