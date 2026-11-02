"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Star, Eye, MessageSquare, EyeOff, CheckCircle2, Trash2 } from "lucide-react";
import { Button } from "@online-store/ui/button";
import type { Review, ReviewReportStatus } from "@/lib/types";

export type { Review };

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          size={14}
          className={
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "text-zinc-300 dark:text-zinc-600"
          }
        />
      ))}
    </div>
  );
}

const reportBadge = (status: ReviewReportStatus) => {
  const map = {
    NONE: { className: "bg-zinc-100 text-zinc-700 border-zinc-200", label: "—" },
    OPEN: { className: "bg-amber-100 text-amber-800 border-amber-200", label: "Reported" },
    RESOLVED: { className: "bg-green-100 text-green-800 border-green-200", label: "Resolved" },
    DISMISSED: { className: "bg-zinc-100 text-zinc-600 border-zinc-200", label: "Dismissed" },
  } as const;
  const { className, label } = map[status];
  return (
    <span
      className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}
    >
      {label}
    </span>
  );
};

export function columns(
  onView: (review: Review) => void,
  onReply: (review: Review) => void,
  onToggleStatus: (review: Review) => void,
  onDismissReport: (review: Review) => void,
  onDelete: (review: Review) => void,
): ColumnDef<Review>[] {
  return [
    {
      accessorFn: (row) => row.product.name,
      id: "product",
      header: "Product",
    },
    {
      accessorFn: (row) => row.product.vendor?.name || "Admin",
      id: "vendor",
      header: "Vendor",
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
      accessorKey: "reportStatus",
      header: "Report",
      cell: ({ row }) => reportBadge(row.original.reportStatus),
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
            <Button
              variant="edit"
              size="iconSm"
              title="Reply"
              onClick={() => onReply(review)}
            >
              <MessageSquare className="w-4 h-4" />
            </Button>
            {review.reportStatus === "OPEN" && (
              <Button
                variant="outline"
                size="iconSm"
                title="Dismiss report"
                onClick={() => onDismissReport(review)}
              >
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
            <Button
              variant="outline"
              size="iconSm"
              title={review.status === "VISIBLE" ? "Hide review" : "Show review"}
              onClick={() => onToggleStatus(review)}
            >
              <EyeOff className="w-4 h-4" />
            </Button>
            <Button
              variant="delete"
              size="iconSm"
              title="Delete review"
              onClick={() => onDelete(review)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        );
      },
    },
  ];
}
