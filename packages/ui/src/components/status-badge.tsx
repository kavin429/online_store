import * as React from "react";
import {
  AlertCircle,
  BadgeCheck,
  Ban,
  CalendarX,
  CheckCircle2,
  Clock,
  Package,
  PackageCheck,
  RotateCcw,
  Truck,
  XCircle,
} from "lucide-react";
import { Badge } from "./badge";
import { cn } from "../lib/utils";

export type StatusBadgeProps = {
  /** Status value from any app. Matching is case/space/underscore insensitive. */
  status: string;
  /** Override the display label (for app-specific wording). */
  label?: string;
  /** Override the icon. */
  icon?: React.ElementType;
  className?: string;
  onClick?: () => void;
  showIcon?: boolean;
};

type StatusConfig = {
  label: string;
  icon: React.ElementType;
  className: string;
};

const STATUS_CONFIG: Record<string, StatusConfig> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className: "bg-green-600 dark:bg-green-500/80",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className: "bg-yellow-500 dark:bg-yellow-500/80",
  },
  processing: {
    label: "Processing",
    icon: Clock,
    className: "bg-blue-600 dark:bg-blue-500/80",
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
    className: "bg-gray-400 dark:bg-gray-600",
  },
  suspended: {
    label: "Suspended",
    icon: AlertCircle,
    className: "bg-red-500 dark:bg-red-500/80",
  },
  blocked: {
    label: "Blocked",
    icon: Ban,
    className: "bg-red-700 dark:bg-red-700/90",
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className: "bg-blue-600 dark:bg-blue-500/80",
  },
  assigned: {
    label: "Assigned",
    icon: Truck,
    className: "bg-sky-600 dark:bg-sky-500/80",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    className: "bg-indigo-600 dark:bg-indigo-500/80",
  },
  picked_up: {
    label: "Picked up",
    icon: Package,
    className: "bg-indigo-500 dark:bg-indigo-500/80",
  },
  out_for_delivery: {
    label: "Out for delivery",
    icon: Truck,
    className: "bg-fuchsia-600 dark:bg-fuchsia-500/80",
  },
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    className: "bg-green-600 dark:bg-green-500/80",
  },
  failed: {
    label: "Failed",
    icon: AlertCircle,
    className: "bg-red-600 dark:bg-red-500/80",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className: "bg-red-600 dark:bg-red-500/80",
  },
  expired: {
    label: "Expired",
    icon: CalendarX,
    className: "bg-gray-500 dark:bg-gray-600",
  },
  paid: {
    label: "Paid",
    icon: BadgeCheck,
    className: "bg-green-600 dark:bg-green-500/80",
  },
  returned: {
    label: "Returned",
    icon: RotateCcw,
    className: "bg-zinc-500 dark:bg-zinc-600",
  },
  unassigned: {
    label: "Unassigned",
    icon: Clock,
    className: "bg-gray-400 dark:bg-gray-600",
  },
};

function normalizeStatus(status: string) {
  return status.trim().toLowerCase().replace(/[\s-]+/g, "_");
}

function fallbackLabel(status: string) {
  return status
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
}

export function StatusBadge({
  status,
  label,
  icon,
  className,
  onClick,
  showIcon = true,
}: StatusBadgeProps) {
  const config = STATUS_CONFIG[normalizeStatus(status)];
  const Icon = icon ?? config?.icon;
  const text = label ?? config?.label ?? fallbackLabel(status);

  return (
    <Badge
      onClick={onClick}
      className={cn(
        "gap-1 border-0 text-white",
        config?.className ?? "bg-gray-400 dark:bg-gray-600",
        onClick && "cursor-pointer transition-opacity hover:opacity-80",
        className
      )}
    >
      {showIcon && Icon ? <Icon className="h-3 w-3" /> : null}
      {text}
    </Badge>
  );
}

export default StatusBadge;
