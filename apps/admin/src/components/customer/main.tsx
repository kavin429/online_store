"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Customer } from "./column";
import CustomerDetailsSheet from "./details-sheet";
import ManageStatusDialog from "@/components/comman/manage-status-dialog";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";

export default function CustomerMain({ data }: { data: Customer[] }) {
  const [customers, setCustomers] = useState(data);

  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const [manageTarget, setManageTarget] = useState<Customer | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleView = (customer: Customer) => {
    setViewingCustomer(customer);
    setSheetOpen(true);
  };

  const handleEdit = (customer: Customer) => {
    setManageTarget(customer);
    setManageOpen(true);
  };

  const handleStatusChanged = (updated: Customer) => {
    setCustomers((prev) =>
      prev.map((c) => (c.id === updated.id ? { ...c, ...updated } : c)),
    );
  };

  const handleCustomerStatusChange = async (
    customer: Customer,
    status: string,
    reason?: string,
  ) => {
    const res = await fetch(`/api/customer/${customer.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(status === "BLOCKED" ? { status, reason } : { status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update customer status");
    }
    return res.json();
  };

  const handleDeleteClick = (customer: Customer) => {
    setDeleteTarget(customer);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/customer/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }

      setCustomers((prev) => prev.filter((c) => c.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete customer.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Customers</h1>
      </div>

      <DataTable
        columns={columns(handleView, handleEdit, handleDeleteClick, handleEdit)}
        data={customers}
        filterBy="name"
      />

      <CustomerDetailsSheet
        customer={viewingCustomer}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
      />

      <ManageStatusDialog
        entity={manageTarget}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onStatusChange={handleCustomerStatusChange}
        onUpdated={handleStatusChanged}
        entityLabel="customer"
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={deleteTarget?.name || `customer #${deleteTarget?.id}`}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}