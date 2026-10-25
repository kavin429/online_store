"use client";

import { useState } from "react";
import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Edit, Trash2, Package, Eye, EyeOff, Check, Copy } from "lucide-react";
import type { Vendor } from "@/lib/types";
import StatusBadge from "@/components/comman/status-badge";
import {toast} from "sonner"

function PasswordCell({ password }: { password?: string | null }) {
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!password) return <span className="text-muted-foreground text-xs">—</span>;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(password);
      setCopied(true);
      toast.success("Password copied to clipboard");
      setTimeout(() => setCopied(false), 1500);
    } catch (err) {
      toast.error("Failed to copy password");
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className="text-sm font-mono">{show ? password : "••••••••"}</span>
      <button
        type="button"
        onClick={() => setShow((v) => !v)}
        className="text-muted-foreground hover:text-foreground"
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
      <button
        type="button"
        onClick={handleCopy}
        className="text-muted-foreground hover:text-foreground"
        title="Copy password"
      >
        {copied ? (
          <Check className="w-3.5 h-3.5 text-green-600" />
        ) : (
          <Copy className="w-3.5 h-3.5" />
        )}
      </button>
    </div>
  );
}
export { type Vendor };

export const columns = (
  onView: (vendor: Vendor) => void,
  onEdit: (vendor: Vendor) => void,
  onDelete: (vendor: Vendor) => void,
  onViewProducts: (vendor: Vendor) => void,
  onManage: (vendor: Vendor) => void,
): ColumnDef<Vendor>[] => [
    {
      accessorKey: "id",
      header: "ID",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <button
            type="button"
            onClick={() => onView(vendor)}
            className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
          >
            #{vendor.id}
          </button>
        );
      },
    },

    {
      accessorKey: "name",
      header: "Vendor",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex items-center gap-3">
            {vendor.image ? (
              <img src={vendor.image} alt={vendor.name ?? "Vendor"} className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-xs font-medium text-muted-foreground">
                {(vendor.name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <p className="font-medium">{vendor.name || "—"}</p>
          </div>
        );
      },
    },

    {
      id: "password",
      header: "Password",
      cell: ({ row }) => <PasswordCell password={row.original.plainPassword} />,
    },

    {
      accessorKey: "email",
      header: "Contact",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <div className="flex flex-col text-sm">
            <span>{vendor.email || "—"}</span>
            <span className="text-muted-foreground">{vendor.phone || "—"}</span>
          </div>
        );
      },
    },

    {
      accessorKey: "city",
      header: "Location",
      cell: ({ row }) => {
        const vendor = row.original;
        const location = [vendor.city, vendor.province, vendor.country].filter(Boolean).join(", ");
        return <span className="text-sm">{location || "—"}</span>;
      },
    },

    {
      accessorKey: "productsCount",
      header: "Products",
      cell: ({ row }) => {
        const vendor = row.original;
        return (
          <button
            type="button"
            onClick={() => onViewProducts(vendor)}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline"
          >
            <Package className="w-3.5 h-3.5" />
            {vendor.productsCount ?? 0}
          </button>
        );
      },
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const vendor = row.original;
        const statusMap: Record<string, "pending" | "active" | "cancelled" | "blocked"> = {
          PENDING: "pending",
          ACTIVE: "active",
          CANCELLED: "cancelled",
          BLOCKED: "blocked",
        };
        return (
          <StatusBadge
            status={statusMap[vendor.status] ?? "pending"}
            onClick={() => onManage(vendor)}
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
        const vendor = row.original;
        return (
          <div className="flex gap-2">
            <Button variant="edit" size="iconSm" onClick={() => onEdit(vendor)}>
              <Edit className="w-4 h-4" />
            </Button>
            <Button variant="delete" size="iconSm" onClick={() => onDelete(vendor)}>
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },


    
  ];
