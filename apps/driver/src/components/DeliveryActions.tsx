"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { toast } from "sonner";
import {
  DELIVERY_LABELS,
  nextDriverActions,
  type DeliveryStatus,
} from "@/lib/delivery";
import { cn } from "@/lib/utils";

const ACTION_LABELS: Partial<Record<DeliveryStatus, string>> = {
  PICKED_UP: "Mark picked up",
  OUT_FOR_DELIVERY: "Start delivery",
  DELIVERED: "Mark delivered",
  FAILED: "Report problem",
};

const ACTION_STYLES: Partial<Record<DeliveryStatus, string>> = {
  DELIVERED: "bg-green-600 text-white hover:bg-green-700",
  FAILED: "border border-red-200 text-red-600 hover:bg-red-50 dark:border-red-900 dark:hover:bg-red-950/30",
};

export default function DeliveryActions({
  deliveryId,
  status,
}: {
  deliveryId: number;
  status: DeliveryStatus;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<DeliveryStatus | null>(null);
  const [note, setNote] = useState("");

  const actions = nextDriverActions(status);

  const update = async (next: DeliveryStatus) => {
    setBusy(next);
    try {
      const res = await fetch(`/api/deliveries/${deliveryId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deliveryStatus: next, note: note.trim() || undefined }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not update delivery");

      toast.success(DELIVERY_LABELS[next]);
      setNote("");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not update delivery");
    } finally {
      setBusy(null);
    }
  };

  if (actions.length === 0) {
    return (
      <div className="rounded-xl border border-green-100 bg-green-50 p-4 text-sm text-green-800 dark:border-green-900/40 dark:bg-green-950/20 dark:text-green-300">
        This delivery is closed. No more actions are needed.
      </div>
    );
  }

  return (
    <div className="space-y-3 rounded-xl border border-fuchsia-100 p-4 dark:border-neutral-800">
      <div>
        <p className="font-semibold">Update delivery</p>
        <p className="text-xs text-muted-foreground">
          The customer sees every update on their tracking page.
        </p>
      </div>

      <textarea
        value={note}
        onChange={(event) => setNote(event.target.value)}
        rows={2}
        placeholder="Note for the customer (optional), e.g. 'Left at the gate'"
        className="w-full rounded-md border bg-background p-2 text-sm"
      />

      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action}
            className={cn(ACTION_STYLES[action])}
            disabled={busy !== null}
            onClick={() => update(action)}
          >
            {busy === action ? "Saving..." : ACTION_LABELS[action]}
          </Button>
        ))}
      </div>
    </div>
  );
}
