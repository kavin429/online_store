"use client";

import { useState } from "react";
import { Button } from "@online-store/ui/button";
import { DataTable } from "@online-store/ui/data-table";
import { columns } from "./column";
import AddCategoryDialog from "./manageCategory";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@online-store/ui/dialog";
import type { Category } from "@/lib/types";

export default function CategoryMain({ data }: { data: Category[] }) {
  const [categories, setCategories] = useState(data);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const router = useRouter();

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
    setDeleteDialogOpen(true);
  };

  // Confirm Delete
  const confirmDelete = async () => {
    if (!categoryToDelete) return;

    try {
      const res = await fetch(`/api/categories/${categoryToDelete.id}`, {
        method: "DELETE",
      });

      if (!res.ok) throw new Error("Delete failed");

      setCategories((prev) =>
        prev.filter((c) => c.id !== categoryToDelete.id)
      );
      setDeleteDialogOpen(false);
      setCategoryToDelete(null);
    } catch (error) {
      console.error("Delete error:", error);
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
        <Button variant="shoe" onClick={handleAddClick}>
          + Add Category
        </Button>
      </div>

      <DataTable
        columns={columns(router, handleEdit, handleDeleteClick)}
        data={categories}
        filterBy="name"
      />

      <AddCategoryDialog
        open={open}
        setOpen={setOpen}
        onAdd={handleAddOrUpdate}
        defaultValues={editingCategory || undefined}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;?</p>
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