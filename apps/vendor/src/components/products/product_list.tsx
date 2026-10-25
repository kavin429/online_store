"use client";

import { useEffect, useState } from "react";
import { Button } from "@online-store/ui/button";
import { DataTable } from "@online-store/ui/data-table";
import { columns } from "./column";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import { useRouter } from "next/navigation";

type VariantAttribute = {
  id: number;
  name: string;
  hexCode?: string | null;
  unit?: string | null;
};

// One real sellable combination, e.g. Red + L
type ProductVariant = {
  id: number;
  sku?: string | null;
  priceOverride?: number | null;
  stock?: number | null;
  image?: string | null;
  attributes: Record<string, VariantAttribute>; // keyed by variant type slug: color/size/weight/...
};

type Product = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;

  costPrice?: number | null;
  sellingPrice?: number | null;
  discountPercent?: number | null;
  stock?: number | null; // total across all variants

  featured?: boolean;
  vendor?: { id: number; name: string } | null;

  images?: { url: string }[];

  category?: {
    id: number;
    name: string;
  };
  subcategory?: {
    id: number;
    name: string;
  } | null;

  variants?: ProductVariant[];
};

export default function ProductMain() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const router = useRouter();

  // ─────────────────────────────
  // Fetch Products
  // ─────────────────────────────
  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");

        if (!res.ok) throw new Error("Failed to fetch products");

        const json = await res.json();

        // your API returns { data: [...] }
        setProducts(json.data || []);
      } catch (error) {
        console.error("Fetch products error:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  // ─────────────────────────────
  // Delete
  // ─────────────────────────────
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!productToDelete) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }

      setProducts((prev) =>
        prev.filter((p) => p.id !== productToDelete.id)
      );

      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete product.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>

        <Button variant="shoe" onClick={() => router.push("/dashboard/products/add")}>
          + Add Product
        </Button>
      </div>


      <DataTable
        columns={columns(router, (p) => router.push(`/dashboard/products/edit?id=${p.id}`), handleDeleteClick)}
        data={products}
        filterBy="name"
      />
      <ConfirmDeleteDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={productToDelete?.name}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
