import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@online-store/ui/select";
import type { VariantValue } from "@/lib/types";

export const columns = (
  typeName: string,
  vendorId: number | null,
  onEdit: (value: VariantValue) => void,
  onDelete: (value: VariantValue) => void,
  onStatusChange: (value: VariantValue, newStatus: "active" | "inactive") => void
): ColumnDef<VariantValue>[] => [
  {
    accessorKey: "name",
    header: typeName,
    cell: ({ row }) => {
      const value = row.original;
      return (
        <div className="flex items-center gap-2">
          {value.hexCode && (
            <span
              className="w-5 h-5 rounded-full border shrink-0"
              style={{ backgroundColor: value.hexCode }}
            />
          )}
          <span className="font-medium">{value.name}</span>
          {value.vendorId === null && (
            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">default</span>
          )}
        </div>
      );
    },
  },
  ...(typeName === "Color"
    ? [{ accessorKey: "hexCode", header: "Hex Code" } as ColumnDef<VariantValue>]
    : []),
  ...(typeName === "Weight" || typeName === "Volume"
    ? [{ accessorKey: "unit", header: "Unit", cell: ({ row }: any) => row.original.unit || "—" } as ColumnDef<VariantValue>]
    : []),
  {
    accessorKey: "sortOrder",
    header: "Order",
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const value = row.original;
      const isDefault = value.vendorId === null;
      return (
        <Select
          value={value.status}
          onValueChange={(v) => onStatusChange(value, v as "active" | "inactive")}
          disabled={isDefault}
        >
          <SelectTrigger
            className={`w-28 h-8 ${
              value.status === "active"
                ? "text-green-600 border-green-600"
                : "text-gray-400 border-gray-300"
            }`}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      );
    },
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const value = row.original;
      const isDefault = value.vendorId === null;
      if (isDefault) return <span className="text-xs text-muted-foreground">—</span>;
      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={() => onEdit(value)}>Edit</Button>
          <Button size="sm" variant="destructive" onClick={() => onDelete(value)}>Delete</Button>
        </div>
      );
    },
  },
];
