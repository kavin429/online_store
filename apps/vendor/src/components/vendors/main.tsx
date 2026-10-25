"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Vendor } from "./column";
import VendorDetailsSheet from "./details-sheet";
import ManageStatusDialog, { StatusOption } from "@/components/comman/manage-status-dialog";
import AddVendorDialog from "./AddVendorDialog";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import { Button } from "@online-store/ui/button";

const vendorStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "Set Pending", buttonVariant: "outline" },
  { value: "ACTIVE", label: "Activate", buttonVariant: "shoesecondary" },
  {
    value: "CANCELLED",
    label: "Reject",
    badgeLabel: "cancelled",
    requiresReason: true,
    buttonVariant: "destructive",
  },
  {
    value: "BLOCKED",
    label: "Block",
    requiresReason: true,
    buttonVariant: "destructive",
  },
];

export default function VendorMain({ data }: { data: Vendor[] }) {
  const [vendors, setVendors] = useState(data);

  const [viewingVendor, setViewingVendor] = useState<Vendor | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [manageTarget, setManageTarget] = useState<Vendor | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Vendor | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [open, setOpen] = useState(false);
  const [editingVendor, setEditingVendor] = useState<Vendor | null>(null);

  const handleAddClick = () => {
    setEditingVendor(null);
    setOpen(true);
  };

  const handleEdit = (vendor: Vendor) => {
    setEditingVendor(vendor);
    setOpen(true);
  };

  const handleManage = (vendor: Vendor) => {
    setManageTarget(vendor);
    setManageOpen(true);
  };

  const handleView = (vendor: Vendor) => {
    setViewingVendor(vendor);
    setSheetOpen(true);
  };

  const handleStatusChanged = (updated: Vendor) => {
    setVendors((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  };

  const handleDeleteClick = (vendor: Vendor) => {
    setDeleteTarget(vendor);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/vendors/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      setVendors((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete vendor.");
    } finally {
      setDeleting(false);
    }
  };

  const handleVendorSaved = (vendor: Vendor) => {
    setVendors((prev) => {
      const exists = prev.some((c) => c.id === vendor.id);
      return exists
        ? prev.map((c) => (c.id === vendor.id ? vendor : c))
        : [vendor, ...prev];
    });
  };

  const handleVendorStatusChange = async (
    vendor: Vendor,
    status: string,
    reason?: string,
  ) => {
    const res = await fetch(`/api/vendors/${vendor.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        status === "BLOCKED" || status === "CANCELLED" ? { status, reason } : { status },
      ),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update vendor status");
    }
    return res.json();
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Vendors</h1>
        <Button variant="shoe" onClick={handleAddClick} size="sm">
          + Add Vendor
        </Button>
      </div>

      <DataTable
        columns={columns(handleView, handleEdit, handleDeleteClick, () => {}, handleManage)}
        data={vendors}
        filterBy="name"
      />

      <AddVendorDialog
        open={open}
        setOpen={setOpen}
        onAdd={handleVendorSaved}
        defaultValues={
          editingVendor
            ? {
                id: editingVendor.id,
                name: editingVendor.name ?? "",
                email: editingVendor.email ?? "",
                phone: editingVendor.phone ?? "",
                country: editingVendor.country ?? "",
                province: editingVendor.province ?? "",
                district: editingVendor.district ?? "",
                city: editingVendor.city ?? "",
                address: editingVendor.address ?? "",
                status: editingVendor.status,
              }
            : undefined
        }
      />

      <VendorDetailsSheet
        vendor={viewingVendor}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <ManageStatusDialog
        entity={manageTarget}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onStatusChange={handleVendorStatusChange}
        onUpdated={handleStatusChanged}
        entityLabel="vendor"
        statusOptions={vendorStatusOptions}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || `vendor #${deleteTarget?.id}`}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}