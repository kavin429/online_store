import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import { Edit, Trash2, Eye } from "lucide-react";
import type { Offer, OfferApprovalStatus, OfferStatus } from "@/lib/types";

export type { Offer, OfferApprovalStatus, OfferStatus };

const approvalBadge = (status: OfferApprovalStatus) => {
  const map = {
    PENDING: { className: "bg-amber-100 text-amber-800 border-amber-200", label: "Pending review" },
    APPROVED: { className: "bg-green-100 text-green-800 border-green-200", label: "Approved" },
    REJECTED: { className: "bg-red-100 text-red-800 border-red-200", label: "Rejected" },
  } as const;
  const { className, label } = map[status];
  return (
    <span className={`inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium ${className}`}>
      {label}
    </span>
  );
};

export const columns = (
  onView: (offer: Offer) => void,
  onEdit: (offer: Offer) => void,
  onDelete: (offer: Offer) => void,
): ColumnDef<Offer>[] => [
  {
    accessorKey: "title",
    header: "Offer",
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="flex items-center gap-3">
          {offer.image ? (
            <img src={offer.image} alt={offer.title} className="w-14 h-9 rounded object-cover" />
          ) : (
            <div className="w-14 h-9 rounded bg-muted" />
          )}
          <div>
            <button
              type="button"
              onClick={() => onView(offer)}
              className="text-sm font-medium text-fuchsia-600 dark:text-fuchsia-400 hover:underline text-left"
            >
              {offer.title}
            </button>
            {offer.subtitle && (
              <p className="text-xs text-muted-foreground line-clamp-1">{offer.subtitle}</p>
            )}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: "badgeText",
    header: "Badge",
    cell: ({ row }) =>
      row.original.badgeText ? (
        <Badge variant="secondary">{row.original.badgeText}</Badge>
      ) : (
        <span className="text-muted-foreground">—</span>
      ),
  },
  {
    id: "products",
    header: "Products",
    cell: ({ row }) => <span className="text-sm">{row.original.products?.length ?? 0}</span>,
  },
  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const { startsAt, endsAt } = row.original;
      if (!startsAt && !endsAt) return <span className="text-sm text-muted-foreground">No limit</span>;
      return (
        <span className="text-sm text-muted-foreground">
          {startsAt ? new Date(startsAt).toLocaleDateString() : "—"}
          {" → "}
          {endsAt ? new Date(endsAt).toLocaleDateString() : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => approvalBadge(row.original.approvalStatus),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onView(offer)}>
            <Eye className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => onEdit(offer)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-red-600 hover:text-red-700"
            onClick={() => onDelete(offer)}
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];
