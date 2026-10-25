import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Edit, Trash } from "lucide-react"; // icon buttons
import type { SubCategory } from "@/lib/types";

export type { SubCategory }; // re-export for backwards compatibility

export const columns = (
  onEdit: (subcategory: SubCategory) => void,
  onDelete: (subcategory: SubCategory) => void
): ColumnDef<SubCategory>[] => [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    id: "status",
    header: "Status",
    cell: ({ row }) => {
      const sub = row.original;
      return sub.status === "ACTIVE" ? (
        <span className="px-2 py-0.5 rounded-full border border-green-500 dark:border-green-300 bg-green-500/90 dark:bg-green-500/50 text-white text-xs">
          Active
        </span>
      ) : <span className="px-2 py-0.5 rounded-full border border-yellow-700 dark:border-yellow-300 bg-yellow-500/90 dark:bg-yellow-500/50 text-white text-xs">
          Pending
        </span>;
    },
  },
  {
    accessorKey: "description",
    header: "Description",
    cell: ({ row }) => row.original.description || "-",
  },
  {
    accessorKey: "commission",
    header: "Commission (%)",
    cell: ({ row }) =>
      row.original.commission !== undefined ? `${row.original.commission}%` : "-",
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const sub = row.original;
      return (
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onEdit(sub)}
            className="p-1 text-fuchsia-600 dark:text-fuchsia-500"
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => onDelete(sub)}
            className="p-1"
          >
            <Trash size={16} className="text-red-600 dark:text-red-500" />
          </Button>
        </div>
      );
    },
  },
];