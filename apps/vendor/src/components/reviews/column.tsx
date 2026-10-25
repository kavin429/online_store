"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Star } from "lucide-react";
import type { Review } from "@/lib/types";

export { type Review };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={s <= rating ? "text-amber-400 fill-amber-400" : "text-slate-300 dark:text-slate-600"}
        />
      ))}
    </div>
  );
}

export function columns(): ColumnDef<Review>[] {
  return [
    {
      accessorFn: (row) => row.product.name,
      id: "product",
      header: "Product",
    },
    {
      accessorFn: (row) => row.user.name || "Anonymous",
      id: "customer",
      header: "Customer",
    },
    {
      accessorKey: "rating",
      header: "Rating",
      cell: ({ row }) => <StarRating rating={row.original.rating} />,
    },
    {
      accessorKey: "comment",
      header: "Comment",
      cell: ({ row }) => (
        <span className="text-sm line-clamp-2 max-w-xs">{row.original.comment || "-"}</span>
      ),
    },
    {
      accessorKey: "responses",
      header: "Responses",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">{row.original.responses.length}</span>
      ),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs">{new Date(row.original.createdAt).toLocaleDateString()}</span>
      ),
    },
  ];
}