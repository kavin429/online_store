import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Edit, Trash2 } from "lucide-react";
import type { Customer, CustomerStatus } from "@/lib/types";
import StatusBadge from "@/components/comman/status-badge";

export type { Customer, CustomerStatus }; // re-export for backwards compatibility

export const columns = (
  onView: (customer: Customer) => void,
  onEdit: (customer: Customer) => void,
  onDelete: (customer: Customer) => void,
  onManage: (customer: Customer) => void,
): ColumnDef<Customer>[] => [
  {
    accessorKey: "id",
    header: "ID",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <button
          type="button"
          onClick={() => onView(customer)}
          className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
        >
          #{customer.id}
        </button>
      );
    },
  },

  {
    accessorKey: "name",
    header: "Customer",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex items-center gap-3">
          {customer.image ? (
            <img
              src={customer.image}
              alt={customer.name ?? "Customer"}
              className="w-9 h-9 rounded-full object-cover"
            />
          ) : (
            <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
              {(customer.name || "?")[0]?.toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium">{customer.name || "—"}</p>
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <div className="flex flex-col text-sm">
          <span>{customer.email || "—"}</span>
          <span className="text-muted-foreground">{customer.phone || "—"}</span>
        </div>
      );
    },
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const customer = row.original;
      return (
        <StatusBadge
          status={customer.status === "BLOCKED" ? "blocked" : "active"}
          onClick={() => onManage(customer)}
        />
      );
    },
  },

  {
    accessorKey: "createdAt",
    header: "Joined",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const customer = row.original;

      return (
        <div className="flex gap-2">
          <Button variant="edit" size="iconSm" onClick={() => onEdit(customer)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="delete" size="iconSm" onClick={() => onDelete(customer)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];