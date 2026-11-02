"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Star, Eye, MessageSquare, Flag } from "lucide-react";
import { Button } from "@online-store/ui/button";
import type { Review } from "@/lib/types";

export { type Review };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          size={14}
          className={
            s <= rating
              ? "text-amber-400 fill-amber-400"
              : "text-slate-300 dark:text-slate-600"
          }
        />
      ))}
    </div>
  );
}

const reportBadge = (review: Review) => {
  if (review.reportStatus === "OPEN") {
    return (
      <span className="inline-flex items-center rounded-md border border-amber-200 bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">
        Reported
      </span>
    );
  }
  if (review.reportStatus === "RESOLVED") {
    return (
      <span className="inline-flex items-center rounded-md border border-green-200 bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Resolved
      </span>
    );
  }
  if (review.reportStatus === "DISMISSED") {
    return (
      <span className="inline-flex items-center rounded-md border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700">
        Dismissed
      </span>
    );
  }
  return <span className="text-muted-foreground">—</span>;
};

export function columns(
  onView: (review: Review) => void,
  onReply: (review: Review) => void,
  onReport: (review: Review) => void,
): ColumnDef<Review>[] {
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
        <span className="line-clamp-2 max-w-xs text-sm">
          {row.original.comment || "-"}
        </span>
      ),
    },
    {
      id: "responses",
      header: "Replies",
      cell: ({ row }) => (
        <span className="text-xs text-muted-foreground">
          {row.original.responses.length}
        </span>
      ),
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => (
        <span
          className={
            row.original.status === "VISIBLE"
              ? "text-xs font-medium text-green-700 dark:text-green-400"
              : "text-xs font-medium text-amber-700 dark:text-amber-400"
          }
        >
          {row.original.status === "VISIBLE" ? "Visible" : "Hidden"}
        </span>
      ),
    },
    {
      id: "report",
      header: "Report",
      cell: ({ row }) => reportBadge(row.original),
    },
    {
      accessorKey: "createdAt",
      header: "Date",
      cell: ({ row }) => (
        <span className="text-xs">
          {new Date(row.original.createdAt).toLocaleDateString()}
        </span>
      ),
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const review = row.original;
        const hasVendorReply = review.responses.some(
          (response) => response.authorType === "VENDOR",
        );
        const canReport =
          review.reportStatus === "NONE" || review.reportStatus === "DISMISSED";

        return (
          <div className="flex gap-2">
            <Button
              variant="edit"
              size="iconSm"
              title="View review"
              onClick={() => onView(review)}
            >
              <Eye className="w-4 h-4" />
            </Button>
            {!hasVendorReply && review.status === "VISIBLE" && (
              <Button
                variant="edit"
                size="iconSm"
                title="Reply"
                onClick={() => onReply(review)}
              >
                <MessageSquare className="w-4 h-4" />
              </Button>
            )}
            {canReport && (
              <Button
                variant="outline"
                size="iconSm"
                title="Report to admin"
                onClick={() => onReport(review)}
              >
                <Flag className="w-4 h-4" />
              </Button>
            )}
          </div>
        );
      },
    },
  ];
}
