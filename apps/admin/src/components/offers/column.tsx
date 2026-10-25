import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import StatusBadge from "../comman/status-badge";
import { Edit, Trash2, Eye, Check, X } from "lucide-react";
import type { Offer, OfferStatus, OfferApprovalStatus } from "@/lib/types";

export type { Offer, OfferStatus, OfferApprovalStatus };

// ACTIVE offers whose end date has passed are shown as "expired".
export const getDisplayStatus = (offer: Offer): "active" | "inactive" | "expired" => {
  if (offer.status === "INACTIVE") return "inactive";
  if (offer.endsAt && new Date(offer.endsAt) < new Date()) return "expired";
  return "active";
};

const approvalBadge = (status: OfferApprovalStatus) => {
  const map = {
    PENDING: { className: "bg-amber-100 text-amber-800 border-amber-200", label: "Pending" },
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
  onApprove: (offer: Offer) => void,
  onReject: (offer: Offer) => void,
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
    id: "promo",
    header: "Promo Code",
    cell: ({ row }) =>
      row.original.promo ? (
        <span className="text-sm font-mono">{row.original.promo.code}</span>
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
    accessorKey: "showOnLanding",
    header: "Landing",
    cell: ({ row }) => (
      <span className="text-sm text-muted-foreground">
        {row.original.showOnLanding ? "Shown" : "Offers page only"}
      </span>
    ),
  },
  {
    accessorKey: "sortOrder",
    header: "Order",
  },
  {
    id: "vendor",
    header: "Vendor",
    cell: ({ row }) =>
      row.original.vendor ? (
        <span className="text-sm">{row.original.vendor.name}</span>
      ) : (
        <span className="text-sm text-muted-foreground">Admin</span>
      ),
  },
  {
    accessorKey: "approvalStatus",
    header: "Approval",
    cell: ({ row }) => approvalBadge(row.original.approvalStatus ?? "APPROVED"),
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
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => <StatusBadge status={getDisplayStatus(row.original)} />,
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const offer = row.original;
      return (
        <div className="flex gap-2">
          <Button variant="edit" size="iconSm" onClick={() => onView(offer)}>
            <Eye className="w-4 h-4" />
          </Button>
          {offer.approvalStatus !== "APPROVED" && (
            <Button
              size="iconSm"
              className="bg-green-600 hover:bg-green-700 text-white"
              onClick={() => onApprove(offer)}
              title="Approve"
            >
              <Check className="w-4 h-4" />
            </Button>
          )}
          {offer.approvalStatus !== "REJECTED" && (
            <Button
              size="iconSm"
              className="bg-amber-600 hover:bg-amber-700 text-white"
              onClick={() => onReject(offer)}
              title="Reject"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
          <Button variant="edit" size="iconSm" onClick={() => onEdit(offer)}>
            <Edit className="w-4 h-4" />
          </Button>
          <Button variant="delete" size="iconSm" onClick={() => onDelete(offer)}>
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      );
    },
  },
];