"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Offer } from "./column";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import { Plus } from "lucide-react";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import OfferFormDialog, { OfferPayload, ProductOption, PromoOption } from "./offer-form";

type Props = { data: Offer[]; products: ProductOption[]; promos: PromoOption[] };

export default function OfferMain({ data, products, promos }: Props) {
  const [offers, setOffers] = useState<Offer[]>(data);

  const [viewing, setViewing] = useState<Offer | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editTarget, setEditTarget] = useState<Offer | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<Offer | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleView = (o: Offer) => { setViewing(o); setViewOpen(true); };

  const setApproval = async (o: Offer, approvalStatus: "APPROVED" | "REJECTED") => {
    try {
      const res = await fetch(`/api/offers/${o.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvalStatus }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to update approval");
      }
      const saved: Offer = await res.json();
      setOffers((prev) => prev.map((x) => (x.id === saved.id ? saved : x)));
    } catch (err: any) {
      setFormError(err.message || "Failed to update approval.");
    }
  };
  const handleApprove = (o: Offer) => setApproval(o, "APPROVED");
  const handleReject = (o: Offer) => setApproval(o, "REJECTED");

  const handleCreate = () => {
    setFormMode("create"); setEditTarget(null); setFormError(null); setFormOpen(true);
  };
  const handleEdit = (o: Offer) => {
    setFormMode("edit"); setEditTarget(o); setFormError(null); setFormOpen(true);
  };

  const handleSubmit = async (payload: OfferPayload) => {
    setSaving(true);
    setFormError(null);
    try {
      const url = formMode === "edit" && editTarget ? `/api/offers/${editTarget.id}` : "/api/offers";
      const res = await fetch(url, {
        method: formMode === "edit" ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Failed to save offer");
      }
      const saved: Offer = await res.json();
      setOffers((prev) =>
        formMode === "edit" ? prev.map((o) => (o.id === saved.id ? saved : o)) : [saved, ...prev],
      );
      setFormOpen(false);
      setEditTarget(null);
    } catch (err: any) {
      setFormError(err.message || "Failed to save offer.");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteClick = (o: Offer) => { setDeleteTarget(o); setDeleteError(null); setDeleteOpen(true); };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/offers/${deleteTarget.id}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      setOffers((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      setDeleteError(err.message || "Failed to delete offer.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Offers</h1>
          <p className="text-sm text-muted-foreground">
            Deals and banners shown on the landing site. Promo codes are managed separately.
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="w-4 h-4 mr-2" />
          New Offer
        </Button>
      </div>

      <DataTable
        columns={columns(handleView, handleEdit, handleDeleteClick, handleApprove, handleReject)}
        data={offers}
        filterBy="title"
      />

      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg space-y-4">
          <DialogHeader>
            <DialogTitle>{viewing?.title}</DialogTitle>
          </DialogHeader>
          {viewing && (
            <div className="space-y-3 text-sm">
              {viewing.image && (
                <img src={viewing.image} alt={viewing.title} className="w-full max-h-48 object-cover rounded" />
              )}
              {(viewing.images?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <p className="text-muted-foreground">Gallery ({viewing.images!.length})</p>
                  <div className="grid grid-cols-4 gap-2">
                    {viewing.images!.map((src, i) => (
                      <img
                        key={i}
                        src={src}
                        alt={`${viewing.title} ${i + 1}`}
                        className="h-16 w-full rounded object-cover"
                      />
                    ))}
                  </div>
                </div>
              )}
              {viewing.subtitle && <p className="font-medium">{viewing.subtitle}</p>}
              {viewing.description && <p className="text-muted-foreground">{viewing.description}</p>}
              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Badge</span>
                  <span>{viewing.badgeText || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Button</span>
                  <span>{viewing.ctaText} → {viewing.ctaLink || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Promo code</span>
                  <span className="font-mono">{viewing.promo?.code || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Vendor</span>
                  <span>{viewing.vendor?.name || "Admin"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Approval</span>
                  <span>{viewing.approvalStatus}</span>
                </div>
                {viewing.reviewNote && (
                  <div className="flex justify-between gap-3">
                    <span className="text-muted-foreground">Review note</span>
                    <span className="text-right">{viewing.reviewNote}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-muted-foreground">On landing page</span>
                  <span>{viewing.showOnLanding ? "Yes" : "Offers page only"}</span>
                </div>
              </div>
              <div className="border-t pt-2 space-y-1">
                <p className="text-muted-foreground">Products ({viewing.products?.length ?? 0})</p>
                <div className="flex flex-wrap gap-1">
                  {(viewing.products || []).map((p) => (
                    <Badge key={p.id} variant="outline">{p.product.name}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <OfferFormDialog
        open={formOpen}
        mode={formMode}
        offer={editTarget}
        products={products}
        promos={promos}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        saving={saving}
        error={formError}
      />

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={`offer "${deleteTarget?.title}"`}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}