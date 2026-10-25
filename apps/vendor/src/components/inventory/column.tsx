"use client";

import { ColumnDef } from "@tanstack/react-table";
import { ArrowUpDown, AlertTriangle } from "lucide-react";
import { Button } from "@online-store/ui/button";
import type { InventoryItem } from "@/lib/types";

export { type InventoryItem };

export function columns(onRestock: (item: InventoryItem) => void): ColumnDef<InventoryItem>[] {
  return [
    {
      accessorKey: "sku",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          SKU <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => (
        <span className="font-mono text-xs">{row.original.sku || "-"}</span>
      ),
    },
    {
      accessorFn: (row) => row.product.name,
      id: "product",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Product <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
    },
    {
      accessorKey: "attributes",
      header: "Attributes",
      cell: ({ row }) => (
        <div className="flex flex-wrap gap-1">
          {row.original.attributes.map((attr, i) => (
            <span key={i} className="inline-flex items-center gap-1 text-xs bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
              {attr.hexCode && (
                <span className="w-2.5 h-2.5 rounded-full border" style={{ backgroundColor: attr.hexCode }} />
              )}
              {attr.type}: {attr.value}
            </span>
          ))}
        </div>
      ),
    },
    {
      accessorKey: "stock",
      header: ({ column }) => (
        <Button variant="ghost" onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}>
          Stock <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      ),
      cell: ({ row }) => {
        const stock = row.original.stock;
        return (
          <div className="flex items-center gap-2">
            <span className={`font-mono text-sm ${stock < 10 ? "text-red-500 font-medium" : ""}`}>
              {stock}
            </span>
            {stock < 10 && <AlertTriangle size={14} className="text-amber-500" />}
          </div>
        );
      },
    },
    {
      accessorKey: "priceOverride",
      header: "Price Override",
      cell: ({ row }) => (
        <span className="font-mono text-xs">
          {row.original.priceOverride != null ? `Rs. ${row.original.priceOverride.toFixed(2)}` : "-"}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => (
        <Button variant="ghost" size="sm" onClick={() => onRestock(row.original)}>
          Restock
        </Button>
      ),
    },
  ];
}
