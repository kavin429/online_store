"use client";

import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@online-store/ui/tabs";
import { Button } from "@online-store/ui/button";
import { DataTable } from "@online-store/ui/data-table";
import { columns } from "./column";
import AddVariantValueDialog from "./manageVariantValue";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@online-store/ui/dialog";
import type { VariantType, VariantValue } from "@/lib/types";

export default function VariantMain({
  variantTypes,
  initialValues,
  vendorId,
}: {
  variantTypes: VariantType[];
  initialValues: VariantValue[];
  vendorId: number | null;
}) {
  const [values, setValues] = useState<VariantValue[]>(initialValues);
  const [activeTab, setActiveTab] = useState(variantTypes[0]?.slug ?? "");
  const [open, setOpen] = useState(false);
  const [editingValue, setEditingValue] = useState<VariantValue | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [valueToDelete, setValueToDelete] = useState<VariantValue | null>(null);

  const activeType = variantTypes.find((t) => t.slug === activeTab);

  const handleEdit = (value: VariantValue) => {
    setEditingValue(value);
    setOpen(true);
  };

  const handleDeleteClick = (value: VariantValue) => {
    setValueToDelete(value);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!valueToDelete) return;
    try {
      const res = await fetch(`/api/variant-values/${valueToDelete.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      setValues((prev) => prev.filter((v) => v.id !== valueToDelete.id));
      setDeleteDialogOpen(false);
      setValueToDelete(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddOrUpdate = (val: VariantValue) => {
    setValues((prev) =>
      editingValue ? prev.map((v) => (v.id === val.id ? val : v)) : [val, ...prev]
    );
    setEditingValue(null);
  };

  const handleStatusChange = async (value: VariantValue, newStatus: "active" | "inactive") => {
    setValues((prev) => prev.map((v) => (v.id === value.id ? { ...v, status: newStatus } : v)));
    try {
      const res = await fetch(`/api/variant-values/${value.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!res.ok) throw new Error("Status update failed");
    } catch (err) {
      console.error(err);
      setValues((prev) => prev.map((v) => (v.id === value.id ? { ...v, status: value.status } : v)));
    }
  };

  return (
    <div>
      {variantTypes.length === 0 ? (
        <p className="text-muted-foreground">No variant types available.</p>
      ) : (
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            {variantTypes.map((type) => (
              <TabsTrigger key={type.id} value={type.slug}>{type.name}</TabsTrigger>
            ))}
          </TabsList>

          {variantTypes.map((type) => (
            <TabsContent key={type.id} value={type.slug} className="space-y-4">
              <div className="flex items-center justify-end">
                <Button
                  variant="shoesecondary"
                  size="sm"
                  onClick={() => { setEditingValue(null); setOpen(true); }}
                >
                  + Add {type.name}
                </Button>
              </div>
              <DataTable
                columns={columns(type.name, vendorId, handleEdit, handleDeleteClick, handleStatusChange)}
                data={values.filter((v) => v.variantTypeId === type.id)}
                filterBy="name"
              />
            </TabsContent>
          ))}
        </Tabs>
      )}

      {activeType && (
        <AddVariantValueDialog
          open={open}
          setOpen={setOpen}
          variantType={activeType}
          onAdd={handleAddOrUpdate}
          defaultValues={editingValue || undefined}
        />
      )}

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader><DialogTitle>Confirm Delete</DialogTitle></DialogHeader>
          <p>Are you sure you want to delete &quot;{valueToDelete?.name}&quot;?</p>
          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={confirmDelete}>Delete</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
