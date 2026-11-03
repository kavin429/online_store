"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function AvailabilityToggle({ available }: { available: boolean }) {
  const router = useRouter();
  const [value, setValue] = useState(available);
  const [saving, setSaving] = useState(false);

  const toggle = async () => {
    const next = !value;
    setSaving(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isAvailable: next }),
      });
      if (!res.ok) throw new Error("Could not update availability");
      setValue(next);
      toast.success(next ? "You are available for deliveries" : "You are now unavailable");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not update availability");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <span
        className={cn(
          "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold",
          value
            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
            : "bg-gray-200 text-gray-600 dark:bg-neutral-800 dark:text-gray-300",
        )}
      >
        <span
          className={cn(
            "h-2 w-2 rounded-full",
            value ? "bg-green-500" : "bg-gray-400",
          )}
        />
        {value ? "Available" : "Unavailable"}
      </span>
      <Button variant="outline" size="sm" onClick={toggle} disabled={saving}>
        {saving ? "Updating..." : value ? "Go offline" : "Go online"}
      </Button>
    </div>
  );
}
