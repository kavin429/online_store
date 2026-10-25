"use client"

import { Badge } from "@online-store/ui/badge"
import { CheckCircle2, Clock, XCircle, AlertCircle, Ban, Truck, PackageCheck, CalendarX } from "lucide-react"
import { cn } from "@/lib/utils"

type Status = "active" | "pending" | "inactive" | "suspended" | "blocked" | "confirmed" |"shipped" |"delivered" |"cancelled" |"expired"

const statusConfig: Record<
  Status,
  { label: string; icon: React.ElementType; className: string }
> = {
  active: {
    label: "Active",
    icon: CheckCircle2,
    className:
      "bg-green-500/90 border border-green-200 dark:bg-green-500/50 dark:border-green-600",
  },
  pending: {
    label: "Pending",
    icon: Clock,
    className:
      "bg-yellow-500/90 border border-yellow-200 dark:bg-yellow-500/50 dark:border-yellow-600",
  },
  inactive: {
    label: "Inactive",
    icon: XCircle,
    className:
      "bg-gray-400/90 border border-gray-200 dark:bg-gray-500/50 dark:border-gray-600",
  },
  suspended: {
    label: "Suspended",
    icon: AlertCircle,
    className:
      "bg-red-500/90 border border-red-200 dark:bg-red-500/50 dark:border-red-600",
  },
  blocked: { 
    label: "Blocked", 
    icon: Ban, 
    className: "bg-red-700/90 border border-red-300 dark:bg-red-700/50 dark:border-red-700", 
  },
  confirmed: {
    label: "Confirmed",
    icon: CheckCircle2,
    className:
      "bg-blue-500/90 border border-blue-200 dark:bg-blue-500/50 dark:border-blue-600",
  }, 
  shipped: {
    label: "Shipped",
    icon: Truck,
    className:
      "bg-indigo-500/90 border border-indigo-200 dark:bg-indigo-500/50 dark:border-indigo-600",
  }, 
  delivered: {
    label: "Delivered",
    icon: PackageCheck,
    className:
      "bg-green-500/90 border border-green-200 dark:bg-green-500/50 dark:border-green-600",
  }, 
 cancelled: {
    label: "Cancelled",
    icon: XCircle,
    className:
      "bg-destructive text-destructive-foreground hover:bg-destructive/90",
  },
  expired: {
    label: "Expired",
    icon: CalendarX,
    className:
      "bg-gray-500/90 border border-gray-200 dark:bg-gray-600/50 dark:border-gray-700",
  },
}

interface StatusBadgeProps {
  status: Status
  className?: string
  onClick?: () => void
}

export default function StatusBadge({ status, className, onClick }: StatusBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge
      onClick={onClick}
      className={cn("gap-1 text-white", config.className, className, onClick && "cursor-pointer hover:opacity-80 transition-opacity")}
    >
      <Icon className="w-3 h-3" />
      {config.label}
    </Badge>
  )
}