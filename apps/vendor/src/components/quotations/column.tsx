import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Eye } from "lucide-react";
import type { Quotation, QuotationStatus } from "@/lib/types";

export type { Quotation, QuotationStatus };

export function quotationRef(id: number) {
  return `QUO-${String(id).padStart(5, "0")}`;
}

export const QUOTATION_STATUS_LABELS: Record<QuotationStatus, string> = {
  REQUESTED: "Requested",
  QUOTED: "Quoted",
  ACCEPTED: "Accepted",
  READY_FOR_PICKUP: "Ready for pickup",
  DRIVER_ASSIGNED: "Driver assigned",
  PICKED_UP: "Picked up",
  RECEIVED: "Received",
  REJECTED: "Rejected",
  CANCELLED: "Cancelled",
};

export const QUOTATION_STATUS_TONES: Record<QuotationStatus, string> = {
  REQUESTED: "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300",
  QUOTED: "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300",
  ACCEPTED: "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-300",
  READY_FOR_PICKUP:
    "bg-violet-100 text-violet-700 dark:bg-violet-950 dark:text-violet-300",
  DRIVER_ASSIGNED: "bg-cyan-100 text-cyan-700 dark:bg-cyan-950 dark:text-cyan-300",
  PICKED_UP: "bg-orange-100 text-orange-700 dark:bg-orange-950 dark:text-orange-300",
  RECEIVED: "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300",
  REJECTED: "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300",
  CANCELLED: "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300",
};

export function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return `Rs. ${Number(value).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString();
}

export const columns = (onView: (quotation: Quotation) => void): ColumnDef<Quotation>[] => [
  {
    id: "ref",
    header: "Quotation",
    cell: ({ row }) => {
      const quotation = row.original;
      return (
        <button
          type="button"
          onClick={() => onView(quotation)}
          className="text-sm font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-400"
        >
          {quotationRef(quotation.id)}
        </button>
      );
    },
  },
  {
    id: "items",
    header: "Items",
    cell: ({ row }) => {
      const items = row.original.items ?? [];
      const totalQty = items.reduce((sum, item) => sum + item.quantity, 0);
      return (
        <span className="text-sm">
          {items.length} product{items.length === 1 ? "" : "s"}
          <span className="text-muted-foreground"> ({totalQty} qty)</span>
        </span>
      );
    },
  },
  {
    accessorKey: "quotedTotal",
    header: "Quoted total",
    cell: ({ row }) => (
      <span className="text-sm font-medium">
        {row.original.quotedTotal > 0 ? formatMoney(row.original.quotedTotal) : "—"}
      </span>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return (
        <span
          className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${QUOTATION_STATUS_TONES[status]}`}
        >
          {QUOTATION_STATUS_LABELS[status]}
        </span>
      );
    },
  },
  {
    id: "pickup",
    header: "Pickup",
    cell: ({ row }) => (
      <div className="text-xs">
        <p>{formatDate(row.original.pickupDate)}</p>
        <p className="text-muted-foreground">
          {row.original.driver?.name ?? "No driver yet"}
        </p>
      </div>
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Requested",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onView(row.original)}
        aria-label="View quotation"
      >
        <Eye className="h-4 w-4 text-fuchsia-500 dark:text-fuchsia-400" />
      </Button>
    ),
  },
];
