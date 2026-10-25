import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  Edit,
  Trash2,
} from "lucide-react";
import type { Order, OrderItem, OrderStatus } from "@/lib/types";

export type { Order, OrderItem, OrderStatus }; // re-export for backwards compatibility

const statusBadge = (status: OrderStatus) => {
  switch (status) {
    case "PENDING":
      return (
        <Badge className="gap-1 bg-yellow-500 text-white hover:bg-yellow-500/90">
          <Clock className="w-3 h-3" /> Pending
        </Badge>
      );
    case "CONFIRMED":
      return (
        <Badge className="gap-1 bg-blue-600 hover:bg-blue-600/90">
          <CheckCircle2 className="w-3 h-3" /> Confirmed
        </Badge>
      );
    case "SHIPPED":
      return (
        <Badge className="gap-1 bg-indigo-600 hover:bg-indigo-600/90">
          <Truck className="w-3 h-3" /> Shipped
        </Badge>
      );
    case "DELIVERED":
      return (
        <Badge className="gap-1 bg-green-600 hover:bg-green-600/90">
          <PackageCheck className="w-3 h-3" /> Delivered
        </Badge>
      );
    case "CANCELLED":
      return (
        <Badge className="gap-1 bg-destructive text-destructive-foreground hover:bg-destructive/90">
          <XCircle className="w-3 h-3" /> Cancelled
        </Badge>
      );
    default:
      return <Badge >{status}</Badge>;
  }
};

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
    cell: ({ row }) => statusBadge(row.original.status),
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
          <Button variant="ghost" size="icon" onClick={() => onEditStatus(order)}>
            <Edit className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onDelete(order)}>
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400" />
          </Button>
        </div>
      );
    },
  },
];