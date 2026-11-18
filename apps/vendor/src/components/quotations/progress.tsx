"use client";

import { Check } from "lucide-react";
import { Progress } from "@online-store/ui/progress";

import { cn } from "@/lib/utils";
import type { QuotationStatus } from "@/lib/types";

const STAGES = [
  { status: "REQUESTED", label: "Requested" },
  { status: "QUOTED", label: "Quoted" },
  { status: "ACCEPTED", label: "Accepted" },
  { status: "READY_FOR_PICKUP", label: "Ready" },
  { status: "DRIVER_ASSIGNED", label: "Driver" },
  { status: "PICKED_UP", label: "Picked up" },
  { status: "RECEIVED", label: "Received" },
] as const;

export function quotationProgress(status: QuotationStatus) {
  if (status === "REJECTED" || status === "CANCELLED") {
    return {
      percent: 0,
      currentIndex: -1,
      label: status === "REJECTED" ? "Rejected" : "Cancelled",
      terminal: true,
    };
  }

  const currentIndex = STAGES.findIndex((stage) => stage.status === status);
  const index = currentIndex < 0 ? 0 : currentIndex;
  const percent = Math.round(((index + 1) / STAGES.length) * 100);

  return {
    percent,
    currentIndex: index,
    label: STAGES[index].label,
    terminal: false,
  };
}

export function QuotationProgress({
  status,
  compact = false,
}: {
  status: QuotationStatus;
  compact?: boolean;
}) {
  const progress = quotationProgress(status);

  if (progress.terminal) {
    if (compact) {
      return (
        <span
          className={cn(
            "inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold",
            status === "REJECTED"
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300",
          )}
        >
          {progress.label}
        </span>
      );
    }

    return (
      <div
        className={cn(
          "rounded-lg border p-3",
          status === "REJECTED"
            ? "border-red-200 bg-red-50/60 dark:border-red-900/40 dark:bg-red-950/20"
            : "border-zinc-200 bg-zinc-50/60 dark:border-neutral-800 dark:bg-neutral-900/40",
        )}
      >
        <p className="text-sm font-medium">{progress.label}</p>
        <p className="text-xs text-muted-foreground">
          This quotation will not move any further through the tracking steps.
        </p>
      </div>
    );
  }

  if (compact) {
    return (
      <div className="min-w-[110px] space-y-1">
        <div className="flex items-center justify-between text-[10px] text-muted-foreground">
          <span>{progress.label}</span>
          <span>{progress.percent}%</span>
        </div>
        <Progress value={progress.percent} className="h-1.5" />
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs">
        <span className="font-medium">
          Step {progress.currentIndex + 1} of {STAGES.length}
        </span>
        <span className="text-muted-foreground">{progress.percent}% complete</span>
      </div>

      <Progress value={progress.percent} className="h-2" />

      <div className="flex gap-1">
        {STAGES.map((stage, index) => {
          const done = index < progress.currentIndex;
          const active = index === progress.currentIndex;

          return (
            <div
              key={stage.status}
              className="flex flex-1 flex-col items-center gap-1 text-center"
            >
              <span
                className={cn(
                  "flex h-5 w-5 items-center justify-center rounded-full border text-[10px] font-semibold transition-colors",
                  done &&
                    "border-fuchsia-500 bg-fuchsia-500 text-white dark:border-fuchsia-400 dark:bg-fuchsia-500",
                  active &&
                    "border-fuchsia-500 text-fuchsia-600 ring-2 ring-fuchsia-500/20 dark:border-fuchsia-400 dark:text-fuchsia-300",
                  !done &&
                    !active &&
                    "border-muted-foreground/30 text-muted-foreground",
                )}
              >
                {done ? <Check className="h-3 w-3" /> : index + 1}
              </span>
              <span
                className={cn(
                  "hidden text-[10px] leading-tight sm:block",
                  active
                    ? "font-medium text-foreground"
                    : "text-muted-foreground",
                )}
              >
                {stage.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
