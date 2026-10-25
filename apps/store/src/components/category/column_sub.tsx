import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { Edit, Trash } from "lucide-react"; // icon buttons

export type SubCategory = {
  id: number;
  name: string;
  status: "ACTIVE" | "PENDING";
  description?: string;
  commission?: number;
  createdAt: string;
  subcategoryId?: number | null;
  image?: string;
  categoryId: number; 
  activeProductCount?: number;  
  pendingProductCount?: number; 
};

export const columns = (
  onEdit: (subcategory: SubCategory) => void,
  onDelete: (subcategory: SubCategory) => void
): ColumnDef<SubCategory>[] => [
  {
    accessorKey: "name",
    header: "Subcategory Name",
  },
  {
    id: "active",
    header: "Active",
    cell: ({ row }) => {
      const sub = row.original;
      return sub.status === "ACTIVE" ? (
        <span className="px-2 py-1 rounded-full bg-green-500 text-white text-sm">
          Active
        </span>
      ) : null;
    },
  },
  {
    id: "pending",
    header: "Pending",
    cell: ({ row }) => {
      const sub = row.original;
      return sub.status === "PENDING" ? (
        <span className="px-2 py-1 rounded-full bg-yellow-500 text-white text-sm">
          Pending
        </span>
      ) : null;
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
            variant="outline"
            onClick={() => onEdit(sub)}
            className="p-1"
          >
            <Edit size={16} />
          </Button>
          <Button
            size="sm"
            variant="destructive"
            onClick={() => onDelete(sub)}
            className="p-1"
          >
            <Trash size={16} />
          </Button>
        </div>
      );
    },
  },
];