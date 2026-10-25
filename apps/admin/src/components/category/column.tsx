import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { useRouter } from "next/navigation";
import type { Category } from "@/lib/types";

// We pass edit callback as argument to columns function
export const columns = (
  router: ReturnType<typeof useRouter>,
  onEdit: (category: Category) => void,
  onDelete: (category: Category) => void,
): ColumnDef<Category>[] => [
  {
  accessorKey: "name",
  header: "Category",
  cell: ({ row }) => {
    const category = row.original;

    return (
      <div className="flex items-center gap-3">
        {category.imageUrl && (
          <img
            src={category.imageUrl}
            alt={category.name}
            className="w-10 h-10 rounded-md object-cover"
          />
        )}
        <span className="font-medium">{category.name}</span>
      </div>
    );
  },
},
  {
    id: "subcategory",
    header: "Subcategory",
    cell: ({ row }) => {
      const category = row.original;
      return (
        <Button
          size="sm"
          variant="secondary"
          onClick={() =>
            router.push(
              `/dashboard/categories/${category.id}/subcategory?categoryName=${encodeURIComponent(category.name)}`,
            )
          }
        >
          Manage Subcategory
        </Button>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const category = row.original;

      const handleEdit = () => {
        onEdit(category); // open edit dialog with this category
      };

      const handleDelete = () => {
        onDelete(category); // call parent delete handler
      };

      return (
        <div className="flex gap-2">
          <Button size="sm" onClick={handleEdit}>
            Edit
          </Button>
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            Delete
          </Button>
        </div>
      );
    },
  },
];
