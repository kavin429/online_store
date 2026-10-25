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
  onEdit: (value: VariantValue) => void,
  onDelete: (value: VariantValue) => void,
  onStatusChange: (value: VariantValue, newStatus: "active" | "inactive") => void,
  getTypeName?: (variantTypeId: number) => string // only passed for "All" tab
): ColumnDef<VariantValue>[] => {
  const isAllTab = typeName === "All";

  const cols: ColumnDef<VariantValue>[] = [];

  // Type column - only on "All" tab
  if (isAllTab && getTypeName) {
    cols.push({
      id: "type",
      header: "Type",
      cell: ({ row }) => (
        <span className="text-sm text-muted-foreground">
          {getTypeName(row.original.variantTypeId)}
        </span>
      ),
    });
  }

  cols.push({
    accessorKey: "name",
    header: isAllTab ? "Name" : typeName,
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
        </div>
      );
    },
  });

  if (typeName === "Color") {
    cols.push({
      accessorKey: "hexCode",
      header: "Hex Code",
    });
  }

  if (typeName === "Weight" || typeName === "Volume" || isAllTab) {
    cols.push({
      accessorKey: "unit",
      header: "Unit",
      cell: ({ row }) => row.original.unit || "—",
    });
  }

  cols.push(
    {
      accessorKey: "sortOrder",
      header: "Order",
    },
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const value = row.original;
        return (
          <Select
            value={value.status}
            onValueChange={(v) =>
              onStatusChange(value, v as "active" | "inactive")
            }
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
        return (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => onEdit(value)}>
              Edit
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => onDelete(value)}
            >
              Delete
            </Button>
          </div>
        );
      },
    }
  )

  return cols;
};