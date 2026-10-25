"use client";

import { useState, useEffect } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { Button } from "@online-store/ui/button";
import SubcategoryForm from "@/components/category/managesubategory";
import { columns as subColumns, SubCategory } from "@/components/category/column_sub";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";

type Props = {
  params: { id: string }; // category id from route
  searchParams?: { categoryName?: string }; // optional category name
};

export default function SubcategoryPage({ params, searchParams }: Props) {
  const categoryId = Number(params.id);
  const categoryName = searchParams?.categoryName || "";

  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);

  // Delete dialog state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<SubCategory | null>(null);

  // Fetch subcategories for this category
  useEffect(() => {
    async function fetchSubs() {
      try {
        const res = await fetch(`/api/subcategories?categoryId=${categoryId}`);
        if (!res.ok) throw new Error("Failed to fetch subcategories");
        const data = await res.json();
        setSubcategories(data);
      } catch (err) {
        console.error(err);
      }
    }
    fetchSubs();
  }, [categoryId]);

  // Add or update subcategory in table
  const handleAddOrUpdate = (sub: SubCategory) => {
    setSubcategories((prev) =>
      editingSub ? prev.map((s) => (s.id === sub.id ? sub : s)) : [sub, ...prev]
    );
    setEditingSub(null);
  };

  // Edit subcategory
  const handleEdit = (sub: SubCategory) => {
    setEditingSub(sub);
    setOpen(true);
  };

  // Prepare delete subcategory
  const handleDelete = (sub: SubCategory) => {
    setSubcategoryToDelete(sub);
    setDeleteDialogOpen(true);
  };

  // Confirm delete
  const confirmDelete = async () => {
    if (!subcategoryToDelete) return;

    try {
      const res = await fetch(`/api/subcategories/${subcategoryToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");

      setSubcategories((prev) => prev.filter((s) => s.id !== subcategoryToDelete.id));
      setDeleteDialogOpen(false);
      setSubcategoryToDelete(null);
    } catch (err) {
      console.error(err);
      alert("Failed to delete subcategory.");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subcategories of {categoryName}</h1>
        <Button
          variant="shoe"
          onClick={() => {
            setEditingSub(null);
            setOpen(true);
          }}
        >
          + Add Subcategory
        </Button>
      </div>

      <SubcategoryForm
        open={open}
        setOpen={setOpen}
        categoryId={categoryId}
        categoryName={categoryName}
        defaultValues={editingSub || undefined}
        onAdd={handleAddOrUpdate}
      />

      <DataTable
        columns={subColumns(handleEdit, handleDelete)}
        data={subcategories}
        filterBy="name"
      />

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>Confirm Delete</DialogTitle>
          </DialogHeader>
          <p>
            Are you sure you want to delete &quot;{subcategoryToDelete?.name}&quot;?
          </p>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
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