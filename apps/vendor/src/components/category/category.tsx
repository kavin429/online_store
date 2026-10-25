"use client";

import { useState } from "react";
import { Button } from "@online-store/ui/button";
import { DataTable } from "@online-store/ui/data-table";
import { columns } from "./column";
import AddCategoryDialog from "./manageCategory";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import { useRouter } from "next/navigation";

type Category = {
  id: number;
  name: string;
  createdAt: string;
};

export default function CategoryMain({ data, role = "admin" }: { data: Category[]; role?: string }) {
  const [categories, setCategories] = useState(data);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const router = useRouter();

  const isVendor = role === "vendor";

  // Add / Edit
  const handleAddClick = () => {
    setEditingCategory(null);
    setOpen(true);
  };
  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setOpen(true);
  };

  // Open Delete Dialog
  const handleDeleteClick = (category: Category) => {
    setCategoryToDelete(category);
    setDeleteError(null);
    setDeleteDialogOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!categoryToDelete) return;
    setDeleting(true);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }

      setCategories((prev) =>
        prev.filter((c) => c.id !== categoryToDelete.id)
      );
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete category.");
    } finally {
      setDeleting(false);
    }
  };

  const handleAddOrUpdate = (cat: Category) => {
    setCategories((prev) =>
      editingCategory
        ? prev.map((c) => (c.id === cat.id ? cat : c))
        : [cat, ...prev]
    );
    setEditingCategory(null);
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        {!isVendor && (
          <Button variant="shoe" onClick={handleAddClick}>
            + Add Category
          </Button>
        )}
      </div>

      <DataTable
        columns={columns(router, isVendor ? undefined : handleEdit, isVendor ? undefined : handleDeleteClick, isVendor)}
        data={categories}
        filterBy="name"
      />

      {!isVendor && (
        <>
          <AddCategoryDialog
            open={open}
            setOpen={setOpen}
            onAdd={handleAddOrUpdate}
            defaultValues={editingCategory || undefined}
          />

          <ConfirmDeleteDialog
            open={deleteDialogOpen}
            onOpenChange={setDeleteDialogOpen}
            onConfirm={confirmDelete}
            itemName={categoryToDelete?.name}
            loading={deleting}
            error={deleteError}
          />
        </>
      )}
    </div>
  );
}
