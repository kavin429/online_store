"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, formatDiscount, type Promo } from "./column";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import { Plus } from "lucide-react";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import PromoFormDialog, { type PromoPayload } from "./promo-form";

type NotifyResult = {
  id: number;
  text: string;
  error: boolean;
};

const formatCurrency = (value: number) =>
  `Rs. ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const formatDate = (value: string) =>
  new Intl.DateTimeFormat(undefined, { timeZone: "UTC" }).format(new Date(value));

function getErrorMessage(error: unknown, fallback: string) {
  return error instanceof Error && error.message ? error.message : fallback;
}

async function getPromo(id: number) {
  const response = await fetch(`/api/promos/${id}`);

  if (!response.ok) {
    const body = (await response.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error || "Failed to load promo");
  }

  return (await response.json()) as Promo;
}

export default function PromoMain({ data }: { data: Promo[] }) {
  const [promos, setPromos] = useState<Promo[]>(data);
  const [viewingPromo, setViewingPromo] = useState<Promo | null>(null);
  const [viewOpen, setViewOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Promo | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Promo | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [notifyingId, setNotifyingId] = useState<number | null>(null);
  const [notifyResult, setNotifyResult] = useState<NotifyResult | null>(null);

  const handleView = (promo: Promo) => {
    setViewingPromo(promo);
    setNotifyResult(null);
    setViewOpen(true);
  };

  const handleCreate = () => {
    setFormMode("create");
    setEditTarget(null);
    setFormError(null);
    setFormOpen(true);
  };

  const handleEdit = (promo: Promo) => {
    setFormMode("edit");
    setEditTarget(promo);
    setFormError(null);
    setFormOpen(true);
  };

  const handleNotify = async (promo: Promo) => {
    setNotifyingId(promo.id);
    setNotifyResult(null);

    try {
      const response = await fetch(`/api/promos/${promo.id}/notify`, { method: "POST" });
      const body = (await response.json().catch(() => ({}))) as {
        error?: string;
        notified?: number;
        targeted?: number;
      };

      if (!response.ok) throw new Error(body.error || "Failed to notify customers");

      const targeted = body.targeted ?? 0;
      const notified = body.notified ?? 0;
      const text =
        targeted === 0
          ? "No eligible customers matched this promo."
          : notified > 0
            ? `${notified} new customer${notified === 1 ? "" : "s"} notified; ${targeted} targeted in total.`
            : "All eligible customers have already been notified.";

      setNotifyResult({ id: promo.id, text, error: false });

      const updatedPromo = await getPromo(promo.id);
      setPromos((current) =>
        current.map((currentPromo) => (currentPromo.id === updatedPromo.id ? updatedPromo : currentPromo)),
      );
      setViewingPromo((current) => (current?.id === updatedPromo.id ? updatedPromo : current));
    } catch (error) {
      setNotifyResult({
        id: promo.id,
        text: getErrorMessage(error, "Failed to notify customers."),
        error: true,
      });
    } finally {
      setNotifyingId(null);
    }
  };

  const handleFormSubmit = async (payload: PromoPayload) => {
    setSaving(true);
    setFormError(null);

    try {
      const isEditing = formMode === "edit" && editTarget !== null;
      const response = await fetch(
        isEditing ? `/api/promos/${editTarget.id}` : "/api/promos",
        {
          method: isEditing ? "PATCH" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );

      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to save promo");
      }

      const savedPromo = (await response.json()) as Promo;
      setPromos((current) =>
        isEditing
          ? current.map((currentPromo) =>
              currentPromo.id === savedPromo.id ? savedPromo : currentPromo,
            )
          : [savedPromo, ...current],
      );
      setFormOpen(false);
      setEditTarget(null);
    } catch (error) {
      setFormError(getErrorMessage(error, "Failed to save promo."));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (promo: Promo) => {
    setDeleteTarget(promo);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;

    setDeleting(true);
    setDeleteError(null);

    try {
      const response = await fetch(`/api/promos/${deleteTarget.id}`, { method: "DELETE" });
      if (!response.ok) {
        const body = (await response.json().catch(() => ({}))) as { error?: string };
        throw new Error(body.error || "Failed to delete promo");
      }

      setPromos((current) => current.filter((promo) => promo.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      setDeleteError(getErrorMessage(error, "Failed to delete promo."));
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Promos</h1>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Promo
        </Button>
      </div>

      {notifyResult && !viewOpen && (
        <p className={`text-sm ${notifyResult.error ? "text-destructive" : "text-muted-foreground"}`}>
          {notifyResult.text}
        </p>
      )}

      <DataTable
        columns={columns(handleView, handleEdit, handleDeleteClick, handleNotify)}
        data={promos}
        filterBy="code"
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg space-y-4">
          <DialogHeader>
            <DialogTitle>{viewingPromo?.code}</DialogTitle>
          </DialogHeader>

          {viewingPromo && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">{viewingPromo.name}</p>
                {viewingPromo.description && (
                  <p className="text-muted-foreground">{viewingPromo.description}</p>
                )}
              </div>

              <div className="space-y-1 border-t pt-2">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="text-right">{formatDiscount(viewingPromo)}</span>
                </div>
                {viewingPromo.minOrderAmount != null && (
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">Minimum order</span>
                    <span>{formatCurrency(viewingPromo.minOrderAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Usage</span>
                  <span>
                    {viewingPromo.usedCount} / {viewingPromo.usageLimit ?? "∞"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Per-customer limit</span>
                  <span>{viewingPromo.usageLimitPerUser}</span>
                </div>
              </div>

              <div className="space-y-2 border-t pt-2">
                <div className="flex items-center justify-between gap-4">
                  <p className="text-muted-foreground">Target audience</p>
                  {viewingPromo.targetType !== "ALL" && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleNotify(viewingPromo)}
                      disabled={notifyingId === viewingPromo.id}
                    >
                      {notifyingId === viewingPromo.id
                        ? "Checking..."
                        : "Notify Matching Customers"}
                    </Button>
                  )}
                </div>
                <Badge variant="outline">{viewingPromo.targetType.replaceAll("_", " ")}</Badge>
                {notifyResult?.id === viewingPromo.id && (
                  <p className={`text-xs ${notifyResult.error ? "text-destructive" : "text-muted-foreground"}`}>
                    {notifyResult.text}
                  </p>
                )}
                {viewingPromo.targetType === "SELECTED_CUSTOMER" && (
                  <div className="mt-1 space-y-0.5 text-xs text-muted-foreground">
                    {viewingPromo.minOrderCount != null && (
                      <p>Minimum orders: {viewingPromo.minOrderCount}</p>
                    )}
                    {viewingPromo.minTotalSpent != null && (
                      <p>Minimum spent: {formatCurrency(viewingPromo.minTotalSpent)}</p>
                    )}
                    {viewingPromo.maxTotalSpent != null && (
                      <p>Maximum spent: {formatCurrency(viewingPromo.maxTotalSpent)}</p>
                    )}
                  </div>
                )}
                {viewingPromo.targetType !== "ALL" && viewingPromo.targetCustomers && (
                  <p className="text-xs text-muted-foreground">
                    {viewingPromo.targetCustomers.length} targeted ·{" "}
                    {viewingPromo.targetCustomers.filter((target) => target.notified).length} notified
                  </p>
                )}
              </div>

              <div className="flex justify-between gap-4 border-t pt-2">
                <span className="text-muted-foreground">Validity</span>
                <span className="text-right">
                  {viewingPromo.startsAt ? formatDate(viewingPromo.startsAt) : "—"} →{" "}
                  {viewingPromo.expiresAt ? formatDate(viewingPromo.expiresAt) : "—"}
                </span>
              </div>

              {(viewingPromo.admin || viewingPromo.vendor) && (
                <div className="flex justify-between gap-4 border-t pt-2">
                  <span className="text-muted-foreground">Created by</span>
                  <span>{viewingPromo.admin?.name || viewingPromo.vendor?.name}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <PromoFormDialog
        open={formOpen}
        mode={formMode}
        promo={editTarget}
        onOpenChange={setFormOpen}
        onSubmit={handleFormSubmit}
        saving={saving}
        error={formError}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={`promo "${deleteTarget?.code ?? ""}"`}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
