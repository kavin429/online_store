"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import { Driver } from "@/lib/types";
import { Ban, CheckCircle2, KeyRound, Trash2 } from "lucide-react";

export const columns = (
  onToggleBlock: (driver: Driver) => void,
  onShowCredentials: (driver: Driver) => void,
  onDelete: (driver: Driver) => void,
): ColumnDef<Driver>[] => [
  {
    accessorKey: "name",
    header: "Driver",
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <div>
          <p className="font-medium">{driver.name}</p>
          <p className="text-xs text-muted-foreground">{driver.username}</p>
        </div>
      );
    },
  },
  {
    accessorKey: "phone",
    header: "Phone",
    cell: ({ row }) => (
      <span className="text-sm">{row.original.phone || "—"}</span>
    ),
  },
  {
    id: "vehicle",
    header: "Vehicle",
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <div className="text-sm">
          <p>{driver.vehicleType || "—"}</p>
          <p className="text-xs text-muted-foreground">
            {driver.vehicleNumber || "No plate"}
          </p>
        </div>
      );
    },
  },
  {
    id: "deliveries",
    header: "Deliveries",
    cell: ({ row }) => (
      <Badge variant="outline">{row.original.deliveriesCount ?? 0}</Badge>
    ),
  },
  {
    id: "availability",
    header: "Available",
    cell: ({ row }) => (
      <Badge
        className={
          row.original.isAvailable && row.original.status === "ACTIVE"
            ? "bg-green-500 text-white"
            : "bg-gray-400 text-white"
        }
      >
        {row.original.isAvailable && row.original.status === "ACTIVE"
          ? "Available"
          : "Unavailable"}
      </Badge>
    ),
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => (
      <Badge
        className={
          row.original.status === "ACTIVE"
            ? "bg-blue-500 text-white"
            : "bg-red-600 text-white"
        }
      >
        {row.original.status === "ACTIVE" ? "Active" : "Blocked"}
      </Badge>
    ),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const driver = row.original;
      return (
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="iconSm"
            title={driver.status === "ACTIVE" ? "Block driver" : "Unblock driver"}
            onClick={() => onToggleBlock(driver)}
          >
            {driver.status === "ACTIVE" ? (
              <Ban className="h-4 w-4" />
            ) : (
              <CheckCircle2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="outline"
            size="iconSm"
            title="Login credentials"
            onClick={() => onShowCredentials(driver)}
          >
            <KeyRound className="h-4 w-4" />
          </Button>
          <Button
            variant="delete"
            size="iconSm"
            title="Delete driver"
            onClick={() => onDelete(driver)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      );
    },
  },
];
