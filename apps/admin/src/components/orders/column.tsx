import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import StatusBadge from "../comman/status-badge";
import {
  Edit,
  Trash2,
} from "lucide-react";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export type { Order, OrderItem, OrderStatus };


const formatCurrency = (value: number) =>
  `Rs. ${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

export const columns = (
  onView: (order: Order) => void,
  onEditStatus: (order: Order) => void,
  onDelete: (order: Order) => void,
): ColumnDef<Order>[] => [
    {
      accessorKey: "id",
      header: "Order",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <button
            type="button"
            onClick={() => onView(order)}
            className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
          >
            #{order.id}
          </button>
        );
      },
    },

    {
      accessorKey: "fullName",
      header: "Customer",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex items-center gap-3">
            {order.user?.image ? (
              <img
                src={order.user.image}
                alt={order.fullName}
                className="w-9 h-9 rounded-full object-cover"
              />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                {order.fullName?.[0]?.toUpperCase() || "?"}
              </div>
            )}
            <div>
              <p className="font-medium">{order.fullName}</p>
              <p className="text-xs text-muted-foreground">{order.email}</p>
            </div>
          </div>
        );
      },
    },

    {
      id: "items",
      header: "Items",
      cell: ({ row }) => {
        const items = row.original.items || [];
        const totalQty = items.reduce((sum, i) => sum + i.quantity, 0);
        return (
          <span className="text-sm">
            {items.length} product{items.length !== 1 ? "s" : ""}
            <span className="text-muted-foreground"> ({totalQty} qty)</span>
          </span>
        );
      },
    },

    {
      accessorKey: "total",
      header: "Total",
      cell: ({ row }) => (
        <span className="font-medium">{formatCurrency(row.original.total)}</span>
      ),
    },

    {
      accessorKey: "paymentMethod",
      header: "Payment",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">{row.original.paymentMethod}</span>
      ),
    },

    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <StatusBadge
          status={row.original.status.toLowerCase() as
            | "pending"
            | "confirmed"
            | "shipped"
            | "delivered"
            | "cancelled"}
        />
      ),
    },

    {
      accessorKey: "createdAt",
      header: "Placed",
      cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
    },

    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const order = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="edit" size="iconSm" onClick={() => onEditStatus(order)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="delete" size="iconSm" onClick={() => onDelete(order)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];