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
  params: { id: string };
  searchParams?: { categoryName?: string };
};

function getVendorRole(): string {
  if (typeof document === "undefined") return "admin";
  const match = document.cookie.match(/vendor_session=([^;]+)/);
  return match ? "vendor" : "admin";
}

export default function SubcategoryPage({ params, searchParams }: Props) {
  const categoryId = Number(params.id);
  const categoryName = searchParams?.categoryName || "";
  const [role, setRole] = useState<string>("admin");

  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [open, setOpen] = useState(false);
  const [editingSub, setEditingSub] = useState<SubCategory | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [subcategoryToDelete, setSubcategoryToDelete] = useState<SubCategory | null>(null);

  useEffect(() => {
    setRole(getVendorRole());
  }, []);

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

  const handleAddOrUpdate = (sub: SubCategory) => {
    setSubcategories((prev) =>
      editingSub ? prev.map((s) => (s.id === sub.id ? sub : s)) : [sub, ...prev]
    );
    setEditingSub(null);
  };

  const handleEdit = (sub: SubCategory) => {
    setEditingSub(sub);
    setOpen(true);
  };

  const handleDelete = (sub: SubCategory) => {
    setSubcategoryToDelete(sub);
    setDeleteDialogOpen(true);
  };

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

  const isVendor = role === "vendor";

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Subcategories of {categoryName}</h1>
        {!isVendor && (
          <Button
            variant="shoe"
            onClick={() => {
              setEditingSub(null);
              setOpen(true);
            }}
          >
            + Add Subcategory
          </Button>
        )}
      </div>

      {!isVendor && (
        <SubcategoryForm
          open={open}
          setOpen={setOpen}
          categoryId={categoryId}
          categoryName={categoryName}
          defaultValues={editingSub || undefined}
          onAdd={handleAddOrUpdate}
        />
      )}

      <DataTable
        columns={subColumns(isVendor ? undefined : handleEdit, isVendor ? undefined : handleDelete)}
        data={subcategories}
        filterBy="name"
      />

      {!isVendor && (
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
      )}
    </div>
  );
}
