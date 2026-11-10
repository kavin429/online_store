"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Check, Copy } from "lucide-react";
import { toast } from "sonner";
import { columns, Vendor } from "./column";
import VendorDetailsSheet from "./details-sheet";
import ManageStatusDialog, { StatusOption } from "@/components/comman/manage-status-dialog";
import AddVendorDialog from "./AddVendorDialog";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import { Button } from "@online-store/ui/button";

type VendorCredentials = { username: string; password: string };

const VENDOR_LOGIN_URL = (() => {
  const base = (
    process.env.NEXT_PUBLIC_VENDOR_APP_URL || "http://localhost:3001"
  ).replace(/\/+$/, "");
  return /\/login$/i.test(base) ? base : `${base}/login`;
})();

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold">{value || "Not available"}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy} disabled={!value}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

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

  const [credentialVendor, setCredentialVendor] = useState<Vendor | null>(null);
  const [credentials, setCredentials] = useState<VendorCredentials | null>(null);
  const [resetting, setResetting] = useState(false);

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

  const handleVendorSaved = (
    vendor: Vendor,
    creds?: VendorCredentials,
  ) => {
    setVendors((prev) => {
      const exists = prev.some((c) => c.id === vendor.id);
      return exists
        ? prev.map((c) => (c.id === vendor.id ? vendor : c))
        : [vendor, ...prev];
    });

    // New vendors get a generated login: show it once so it can be copied.
    if (creds) {
      setCredentialVendor(vendor);
      setCredentials(creds);
    }
  };

  const showCredentials = (vendor: Vendor) => {
    setCredentialVendor(vendor);
    setCredentials(
      vendor.plainPassword
        ? {
            username: vendor.username || vendor.email || "",
            password: vendor.plainPassword,
          }
        : null,
    );
  };

  const resetPassword = async () => {
    if (!credentialVendor) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/vendors/${credentialVendor.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to reset password");

      const updated = body.data ?? {};
      setCredentialVendor((current) => (current ? { ...current, ...updated } : current));
      setVendors((current) =>
        current.map((item) =>
          item.id === credentialVendor.id ? { ...item, ...updated } : item,
        ),
      );
      setCredentials(body.credentials);
      toast.success("New password generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
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

    const updated = await res.json();
    if (status === "ACTIVE" && updated.emailSent) {
      toast.success("Vendor activated. Login details emailed.");
    }
    return updated;
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
        columns={columns(
          handleView,
          handleEdit,
          handleDeleteClick,
          () => { },
          handleManage,
          showCredentials,
        )}
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

      {/* Generated vendor login */}
      <Dialog
        open={!!credentialVendor}
        onOpenChange={(isOpen) => {
          if (!isOpen) {
            setCredentialVendor(null);
            setCredentials(null);
          }
        }}
      >
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle>Vendor login — {credentialVendor?.name}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Give these credentials to the vendor. They sign in at{" "}
            <span className="font-mono break-all">{VENDOR_LOGIN_URL}</span>.
          </p>

          <CopyValue
            label="Username"
            value={
              credentials?.username ??
              credentialVendor?.username ??
              credentialVendor?.email ??
              ""
            }
          />
          <CopyValue
            label="Password"
            value={credentials?.password ?? credentialVendor?.plainPassword ?? ""}
          />

          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialVendor(null)}>
              Close
            </Button>
            <Button onClick={resetPassword} disabled={resetting}>
              {resetting ? "Generating..." : "Reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}