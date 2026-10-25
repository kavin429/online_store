import type { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import StatusBadge from "../comman/status-badge";
import {
  Bell,
  Edit,
  Eye,
  Globe,
  Trash2,
  UserCheck,
  UserPlus,
  Users,
} from "lucide-react";
import type {
  Promo,
  PromoDiscountType,
  PromoStatus,
  PromoTargetType,
} from "@/lib/types";

export type { Promo, PromoDiscountType, PromoStatus, PromoTargetType };

const formatCurrency = (value: number) =>
  `Rs. ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export const formatDiscount = (promo: Promo) => {
  if (promo.discountType === "PERCENTAGE") {
    const maximum = promo.maxDiscount != null ? ` (up to ${formatCurrency(promo.maxDiscount)})` : "";
    return `${promo.discountValue}%${maximum}`;
  }
  return formatCurrency(promo.discountValue);
};

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { timeZone: "UTC" }).format(new Date(value));

const targetConfig: Record<
  PromoTargetType,
  { label: string; icon: typeof Globe; className: string }
> = {
  ALL: {
    label: "All Customers",
    icon: Globe,
    className: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
  },
  NEW_CUSTOMER: {
    label: "New Customers",
    icon: UserPlus,
    className: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  },
  OLD_CUSTOMER: {
    label: "Existing Customers",
    icon: UserCheck,
    className: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  },
  SELECTED_CUSTOMER: {
    label: "Selected Customers",
    icon: Users,
    className: "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/40 dark:text-fuchsia-300",
  },
};

export const columns = (
  onView: (promo: Promo) => void,
  onEdit: (promo: Promo) => void,
  onDelete: (promo: Promo) => void,
  onNotify: (promo: Promo) => void,
): ColumnDef<Promo>[] => [
  {
    accessorKey: "code",
    header: "Promo Code",
    cell: ({ row }) => (
      <button
        type="button"
        onClick={() => onView(row.original)}
        className="text-sm font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-400"
      >
        {row.original.code}
      </button>
    ),
  },
  {
    accessorKey: "name",
    header: "Name",
    cell: ({ row }) => (
      <div>
        <p className="font-medium">{row.original.name}</p>
        {row.original.description && (
          <p className="line-clamp-1 text-xs text-muted-foreground">
            {row.original.description}
          </p>
        )}
      </div>
    ),
  },
  {
    id: "discount",
    header: "Discount",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{formatDiscount(row.original)}</span>
    ),
  },
  {
    accessorKey: "targetType",
    header: "Target",
    cell: ({ row }) => {
      const target = targetConfig[row.original.targetType];
      const Icon = target.icon;
      return (
        <Badge variant="outline" className={`gap-1 border-none font-normal ${target.className}`}>
          <Icon className="h-3 w-3" />
          {target.label}
        </Badge>
      );
    },
  },
  {
    id: "usage",
    header: "Usage",
    cell: ({ row }) => (
      <span className="text-sm">
        {row.original.usedCount}
        <span className="text-muted-foreground">
          {" "}
          / {row.original.usageLimit ?? "∞"} · {row.original.usageLimitPerUser}/customer
        </span>
      </span>
    ),
  },
  {
    id: "validity",
    header: "Validity",
    cell: ({ row }) => {
      const { startsAt, expiresAt } = row.original;
      if (!startsAt && !expiresAt) {
        return <span className="text-sm text-muted-foreground">No limit</span>;
      }
      return (
        <span className="text-sm text-muted-foreground">
          {startsAt ? formatDate(startsAt) : "—"} → {expiresAt ? formatDate(expiresAt) : "—"}
        </span>
      );
    },
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <StatusBadge
        status={row.original.status.toLowerCase() as "active" | "inactive" | "expired"}
      />
    ),
  },
  {
    accessorKey: "createdAt",
    header: "Created",
    cell: ({ row }) => formatDate(row.original.createdAt),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => (
      <div className="flex gap-2">
        {row.original.targetType !== "ALL" && (
          <Button
            variant="edit"
            size="iconSm"
            onClick={() => onNotify(row.original)}
            title="Notify matching customers"
            aria-label={`Notify customers for ${row.original.code}`}
          >
            <Bell className="h-4 w-4" />
          </Button>
        )}
        <Button
          variant="edit"
          size="iconSm"
          onClick={() => onView(row.original)}
          title="View promo"
          aria-label={`View ${row.original.code}`}
        >
          <Eye className="h-4 w-4" />
        </Button>
        <Button
          variant="edit"
          size="iconSm"
          onClick={() => onEdit(row.original)}
          title="Edit promo"
          aria-label={`Edit ${row.original.code}`}
        >
          <Edit className="h-4 w-4" />
        </Button>
        <Button
          variant="delete"
          size="iconSm"
          onClick={() => onDelete(row.original)}
          title="Delete promo"
          aria-label={`Delete ${row.original.code}`}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    ),
  },
];
