"use client";

import { Check, Crown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@online-store/ui/select";
import { STATUS_STYLE, TIERS } from "./constants";
import type { OrderStatus, TierName } from "./types";

export const cardCls =
  "rounded-xl border border-fuchsia-200 bg-background p-4 shadow-sm shadow-fuchsia-100/50 sm:p-6 dark:border-fuchsia-900/50 dark:shadow-none";
export const h2Cls = "text-base font-semibold text-fuchsia-900 sm:text-lg dark:text-fuchsia-100";
export const mutedCls = "text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70";
export const labelCls = "text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200";

export function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className={labelCls}>{label}</label>
      {children}
    </div>
  );
}

export function PickList({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
  placeholder: string;
  disabled?: boolean;
}) {
  return (
    <Select value={value} onValueChange={onChange} disabled={disabled}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {options.map((o) => (
          <SelectItem key={o} value={o}>
            {o}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLE[status]}`}
    >
      {status}
    </span>
  );
}

export function TierChip({ tier }: { tier: TierName }) {
  const t = TIERS.find((x) => x.name === tier)!;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${t.chip}`}
    >
      <Crown className="h-3 w-3" /> {tier}
    </span>
  );
}

export function ProgressBar({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-fuchsia-100 dark:bg-fuchsia-950/50">
      <div
        className="h-full rounded-full bg-gradient-to-r from-fuchsia-600 to-fuchsia-400"
        style={{ width: `${pct}%` }}
      />
    </div>
  );
}

export function CheckLine({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex gap-2 text-sm">
      <Check className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
      {children}
    </li>
  );
}
