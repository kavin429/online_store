import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { useRouter } from "next/navigation";

export type Category = {
  id: number;
  name: string;
  createdAt: string;
  subcategoryId?: number | null;
  imageUrl?: string;
};

export const columns = (
  router: ReturnType<typeof useRouter>,
  onEdit?: (category: Category) => void,
  onDelete?: (category: Category) => void,
  isVendor?: boolean,
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
          {isVendor ? "View Subcategory" : "Manage Subcategory"}
        </Button>
      );
    },
  },
  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) => new Date(row.original.createdAt).toLocaleDateString(),
  },
  ...(!isVendor
    ? [
        {
          id: "actions",
          header: "Actions",
          cell: ({ row }: { row: any }) => {
            const category = row.original;

            const handleEdit = () => {
              onEdit?.(category);
            };

            const handleDelete = () => {
              onDelete?.(category);
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
      ]
    : []),
];
