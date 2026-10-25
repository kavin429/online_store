"use client";

import { useEffect, useState } from "react";
import { Button } from "@online-store/ui/button";
import { DataTable } from "@online-store/ui/data-table";
import { columns } from "./column";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import type { Product } from "@/lib/types";

export default function ProductMain() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
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

    try {
      const res = await fetch(`/api/products/${productToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setProducts((prev) =>
        prev.filter((p) => p.id !== productToDelete.id)
      );

      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
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
      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>

          <p>
            Are you sure you want to delete &quot;{productToDelete?.name}&quot;?
          </p>

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
            >
              Cancel
            </Button>

            <Button variant="destructive" onClick={confirmDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
