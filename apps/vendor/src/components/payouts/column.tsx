"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown } from "lucide-react";
import { Button } from "@online-store/ui/button";
import type { Payout } from "@/lib/types";
import StatusBadge from "@/components/comman/status-badge";

export { type Payout };

const statusMap: Record<string, "pending" | "paid" | "cancelled"> = {
  PENDING: "pending",
  PAID: "paid",
  CANCELLED: "cancelled",
};

export const columns: ColumnDef<Payout>[] = [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => <span className="font-mono text-xs">#{row.original.id}</span>,
  },
  {
    accessorKey: "period",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Period <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
  },
  {
    accessorKey: "amount",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Amount <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="font-mono text-sm">Rs. {row.original.amount.toLocaleString()}</span>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.original.status;
      return <StatusBadge status={statusMap[status] ?? "pending"} />;
    },
  },
  {
    accessorKey: "items",
    header: "Orders",
    cell: ({ row }) => <span className="text-sm">{row.original.items.length} orders</span>,
  },
  {
    accessorKey: "paidAt",
    header: "Paid At",
    cell: ({ row }) => (
      <span className="text-xs text-muted-foreground">
        {row.original.paidAt ? new Date(row.original.paidAt).toLocaleDateString() : "-"}
      </span>
    ),
  },
  {
    accessorKey: "createdAt",
    header: ({ column }) => (
      <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
        Created <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <span className="text-xs">{new Date(row.original.createdAt).toLocaleDateString()}</span>,
  },
];