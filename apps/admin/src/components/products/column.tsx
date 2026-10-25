import { ColumnDef } from "@tanstack/react-table";
import { Button } from "@online-store/ui/button";
import { useRouter } from "next/navigation";
import { ExternalLinkIcon, Edit,Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";

export const columns = (
  router: ReturnType<typeof useRouter>,
  onEdit: (product: Product) => void,
  onDelete: (product: Product) => void,
): ColumnDef<Product>[] => [
  {
    accessorKey: "name",
    header: "Product",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex items-center gap-3">
          {product.images?.[0]?.url && (
            <img
              src={product.images[0].url}
              alt={product.name}
              className="w-10 h-10 rounded-md object-cover"
            />
          )}
          <div>
            <p className="font-medium">{product.name}</p>
            {product.featured && (
              <span className="text-xs text-fuchsia-500 dark:text-fuchsia-400">Featured</span>
            )}
          </div>
        </div>
      );
    },
  },

  {
    accessorKey: "category",
    header: "Category",
    cell: ({ row }) => {
      const product = row.original;
      return product.category?.name || "—";
    },
  },

  {
    accessorKey: "price",
    header: "Price",
    cell: ({ row }) => {
      const product = row.original;
      return (
        <div className="flex flex-col">
          <span>Cost: LKR{product.costPrice ?? 0}</span>
          <span className="text-green-600">
            Sell: LKR{product.sellingPrice ?? 0}
          </span>
        </div>
      );
    },
  },

  {
    accessorKey: "stock",
    header: "Stock",
    cell: ({ row }) => {
      const product = row.original;
      return product.stock ?? 0;
    },
  },

  {
    accessorKey: "vendor",
    header: "Added By",
    cell: ({ row }) => 
  row.original.vendor?.name 
    ? `${row.original.vendor.name} Vendor` 
    : "Admin",
  },

  {
    accessorKey: "createdAt",
    header: "Created At",
    cell: ({ row }) =>
      new Date(row.original.createdAt).toLocaleDateString(),
  },

  {
    id: "actions",
    header: "Actions",
    cell: ({ row }) => {
      const product = row.original;

      return (
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
            <Edit className="w-4 h-4"/>
          </Button>

          <Button
            size="icon"
            variant="ghost"
            onClick={() => onDelete(product)}
          >
            <Trash2 className="w-4 h-4 text-red-500 dark:text-red-400"/>
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={() => router.push(`/dashboard/products/view?id=${product.id}`)}
          >
            <ExternalLinkIcon className="w-4 h-4 text-fuchsia-500 dark:text-fuchsia-400"/>
          </Button>
        </div>
      );
    },
  },
];