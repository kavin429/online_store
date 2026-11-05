"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Eye, Package, Settings2, Store } from "lucide-react";
import type { Vendor } from "@/lib/types";
import StatusBadge from "@/components/comman/status-badge";

export type Store = Vendor;

export const storeDisplayName = (store: Store) =>
  store.vendorSettings?.storeName?.trim() || store.name?.trim() || `Store #${store.id}`;

export const storeLogo = (store: Store) =>
  store.vendorSettings?.storeLogo || store.image || null;

export const columns = (
  onView: (store: Store) => void,
  onManage: (store: Store) => void,
): ColumnDef<Store>[] => [
  {
    id: "storeName",
    accessorFn: (row) => storeDisplayName(row),
    header: "Store",
    cell: ({ row }) => {
      const store = row.original;
      const logo = storeLogo(store);

      return (
        <button
          type="button"
          onClick={() => onView(store)}
          className="flex items-center gap-3 text-left"
        >
          {logo ? (
            <img
              src={logo}
              alt={storeDisplayName(store)}
              className="h-10 w-10 rounded-lg border object-cover"
            />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-muted text-muted-foreground">
              <Store className="h-4 w-4" />
            </div>
          )}
          <div className="min-w-0">
            <p className="truncate font-medium">{storeDisplayName(store)}</p>
            <p className="truncate text-xs text-muted-foreground">
              {store.vendorSettings?.storeName ? store.name || "Vendor" : "Store profile not set up"}
            </p>
          </div>
        </button>
      );
    },
  },

  {
    accessorKey: "email",
    header: "Contact",
    cell: ({ row }) => {
      const store = row.original;
      return (
        <div className="flex flex-col text-sm">
          <span>{store.email || "—"}</span>
          <span className="text-muted-foreground">{store.phone || "—"}</span>
        </div>
      );
    },
  },

  {
    accessorKey: "city",
    header: "Location",
    cell: ({ row }) => {
      const store = row.original;
      const location = [store.city, store.province, store.country]
        .filter(Boolean)
        .join(", ");
      return <span className="text-sm">{location || "—"}</span>;
    },
  },

  {
    accessorKey: "productsCount",
    header: "Products",
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => onView(row.original)}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-400"
      >
        <Package className="h-3.5 w-3.5" />
        {row.original.productsCount ?? 0}
      </button>
    ),
  },

  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status}
        onClick={() => onManage(row.original)}
      />
    ),
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
      const store = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="edit" size="iconSm" onClick={() => onView(store)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="iconSm" onClick={() => onManage(store)}>
            <Settings2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
