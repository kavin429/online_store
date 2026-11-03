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
      id: "delivery",
      header: "Delivery",
      cell: ({ row }) => {
        const order = row.original;
        const label = (order.deliveryStatus || "UNASSIGNED").replaceAll("_", " ");
        const tone =
          order.deliveryStatus === "DELIVERED"
            ? "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300"
            : order.deliveryStatus === "FAILED" || order.deliveryStatus === "CANCELLED"
              ? "bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300"
              : order.deliveryStatus && order.deliveryStatus !== "UNASSIGNED"
                ? "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300"
                : "bg-gray-100 text-gray-600 dark:bg-neutral-800 dark:text-gray-300";

        return (
          <div className="space-y-1">
            <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${tone}`}>
              {label}
            </span>
            <p className="text-xs text-muted-foreground">
              {order.driver ? order.driver.name : "No driver"}
            </p>
          </div>
        );
      },
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