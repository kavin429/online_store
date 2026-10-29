"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, InventoryItem } from "./column";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { AlertTriangle, Clock, Tag } from "lucide-react";
import type { InventoryBatch } from "@/lib/types";
import { formatExpiry, toDateInputValue } from "@/lib/expiry";

type ClearanceContext = {
  productId: number;
  productName: string;
  sku: string | null;
  quantity: number;
  expiresAt: string;
  emailSent: boolean;
};

function sortBatches(batches: InventoryBatch[]): InventoryBatch[] {
  return [...batches].sort((a, b) => {
    const aTime = a.expiresAt ? new Date(a.expiresAt).getTime() : null;
    const bTime = b.expiresAt ? new Date(b.expiresAt).getTime() : null;
    if (aTime !== null && bTime !== null && aTime !== bTime) return aTime - bTime;
    if (aTime !== null && bTime === null) return -1;
    if (aTime === null && bTime !== null) return 1;
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  });
}

function todayInputValue() {
  return toDateInputValue(new Date());
}

export default function InventoryMain({
  data,
  lowStockCount,
  expiredBatches = 0,
  expiringSoonBatches = 0,
}: {
  data: InventoryItem[];
  lowStockCount: number;
  expiredBatches?: number;
  expiringSoonBatches?: number;
}) {
  const [items, setItems] = useState<InventoryItem[]>(data);

  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockQty, setRestockQty] = useState(1);
  const [restockNote, setRestockNote] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [batchNumber, setBatchNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [restockError, setRestockError] = useState<string | null>(null);

  const [clearance, setClearance] = useState<ClearanceContext | null>(null);
  const [clearanceOpen, setClearanceOpen] = useState(false);
  const [clearanceTitle, setClearanceTitle] = useState("");
  const [discountPercent, setDiscountPercent] = useState(20);
  const [clearanceStart, setClearanceStart] = useState("");
  const [clearanceEnd, setClearanceEnd] = useState("");
  const [clearanceSaving, setClearanceSaving] = useState(false);
  const [clearanceError, setClearanceError] = useState<string | null>(null);
  const [clearanceDone, setClearanceDone] = useState(false);

  const handleRestock = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty(1);
    setRestockNote("");
    setExpiresAt("");
    setBatchNumber("");
    setRestockError(null);
    setRestockOpen(true);
  };

  const confirmRestock = async () => {
    if (!restockItem || restockQty <= 0) return;
    setSaving(true);
    setRestockError(null);
    try {
      const res = await fetch(`/api/inventory/${restockItem.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          quantity: restockQty,
          note: restockNote,
          expiresAt: expiresAt || null,
          batchNumber: batchNumber || null,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to restock");

      const savedBatch: InventoryBatch | null = body.batch ?? null;
      setItems((prev) =>
        prev.map((item) => {
          if (item.id !== restockItem.id) return item;
          const batches = savedBatch
            ? sortBatches([...(item.batches || []), savedBatch])
            : item.batches || [];
          const dated = batches.filter((batch) => batch.expiresAt);
          return {
            ...item,
            stock: item.stock + restockQty,
            batches,
            nearestExpiry: dated.length > 0 ? dated[0].expiresAt : null,
          };
        }),
      );

      setRestockOpen(false);

      // When an expiry date was captured, offer a one-click clearance deal for
      // this product so short-dated stock is promoted at the same time.
      if (expiresAt && savedBatch) {
        setClearance({
          productId: restockItem.product.id,
          productName: restockItem.product.name,
          sku: restockItem.sku,
          quantity: restockQty,
          expiresAt,
          emailSent: body.expiryNotice?.sent === true,
        });
        setClearanceTitle(`${restockItem.product.name} Clearance`);
        setDiscountPercent(20);
        setClearanceStart(todayInputValue());
        setClearanceEnd(expiresAt);
        setClearanceError(null);
        setClearanceDone(false);
        setClearanceOpen(true);
      }

      setRestockItem(null);
    } catch (err: any) {
      setRestockError(err?.message || "Failed to restock");
    } finally {
      setSaving(false);
    }
  };

  const submitClearanceOffer = async () => {
    if (!clearance) return;
    if (!clearanceTitle.trim()) {
      setClearanceError("Give the offer a title.");
      return;
    }
    if (discountPercent <= 0 || discountPercent >= 100) {
      setClearanceError("Discount must be between 1% and 99%.");
      return;
    }
    if (clearanceStart && clearanceEnd && clearanceEnd < clearanceStart) {
      setClearanceError("End date can't be before the start date.");
      return;
    }

    setClearanceSaving(true);
    setClearanceError(null);
    try {
      const res = await fetch("/api/offers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: clearanceTitle.trim(),
          subtitle: `Clearance – expires ${formatExpiry(clearance.expiresAt)}`,
          description: `${clearance.quantity} unit${
            clearance.quantity === 1 ? "" : "s"
          } expiring on ${formatExpiry(clearance.expiresAt)}. Save ${
            discountPercent
          }% while stock lasts.`,
          badgeText: `${discountPercent}% OFF`,
          ctaText: "Shop Now",
          ctaLink: `/products/${clearance.productId}`,
          productIds: [clearance.productId],
          startsAt: clearanceStart || null,
          endsAt: clearanceEnd || null,
          basis: "CLEARANCE",
          discountPercent,
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to create offer");
      setClearanceDone(true);
    } catch (err: any) {
      setClearanceError(err?.message || "Failed to create offer");
    } finally {
      setClearanceSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Stock is sold first-in-first-out: the oldest expiry date is used first.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3 text-sm">
          {lowStockCount > 0 && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <AlertTriangle size={16} />
              <span>{lowStockCount} low stock</span>
            </div>
          )}
          {expiringSoonBatches > 0 && (
            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
              <Clock size={16} />
              <span>{expiringSoonBatches} expiring in 7 days</span>
            </div>
          )}
          {expiredBatches > 0 && (
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400">
              <AlertTriangle size={16} />
              <span>{expiredBatches} expired</span>
            </div>
          )}
        </div>
      </div>

      <DataTable columns={columns(handleRestock)} data={items} filterBy="sku" />

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle>Restock Variant</DialogTitle>
            <DialogDescription>
              Each restock is stored as a batch. Batches with the earliest expiry are sold first.
            </DialogDescription>
          </DialogHeader>

          {restockItem && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{restockItem.product.name}</p>
                <p className="text-muted-foreground font-mono text-xs">{restockItem.sku}</p>
                <p className="text-muted-foreground">Current stock: {restockItem.stock}</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Quantity to add</Label>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    value={restockQty}
                    onChange={(e) => setRestockQty(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Batch number (optional)</Label>
                  <Input
                    value={batchNumber}
                    onChange={(e) => setBatchNumber(e.target.value)}
                    placeholder="e.g. LOT-2026-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Expiration date (optional)</Label>
                <Input
                  type="date"
                  value={expiresAt}
                  onChange={(e) => setExpiresAt(e.target.value)}
                />
                <p className="text-[11px] text-muted-foreground">
                  Adding an expiry date emails the vendor and admin, and offers to create a
                  clearance deal.
                </p>
              </div>

              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. New batch received"
                />
              </div>

              {(restockItem.batches?.length ?? 0) > 0 && (
                <div className="space-y-1">
                  <Label>On-hand batches</Label>
                  <div className="max-h-32 overflow-y-auto rounded border divide-y text-xs">
                    {restockItem.batches.map((batch) => (
                      <div key={batch.id} className="flex justify-between gap-2 px-2 py-1.5">
                        <span className="font-mono">{batch.batchNumber || `#${batch.id}`}</span>
                        <span>x{batch.remaining}</span>
                        <span className="text-muted-foreground">
                          {batch.expiresAt ? formatExpiry(batch.expiresAt) : "No expiry"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {restockError && <p className="text-sm text-destructive">{restockError}</p>}
            </div>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRestockOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={confirmRestock} disabled={saving || restockQty <= 0}>
              {saving ? "Saving..." : "Restock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Clearance Offer Dialog */}
      <Dialog open={clearanceOpen} onOpenChange={setClearanceOpen}>
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Tag size={18} />
              Create a clearance offer?
            </DialogTitle>
            <DialogDescription>
              {clearance
                ? `${clearance.quantity} unit${
                    clearance.quantity === 1 ? "" : "s"
                  } of ${clearance.productName} expire on ${formatExpiry(
                    clearance.expiresAt,
                  )}. Offer them at a discount now.`
                : ""}
            </DialogDescription>
          </DialogHeader>

          {clearanceDone ? (
            <div className="space-y-3 text-sm">
              <p className="rounded-md bg-green-50 p-3 text-green-700 dark:bg-green-950/40 dark:text-green-400">
                Clearance offer submitted for admin approval.
              </p>
              <DialogFooter>
                <Button onClick={() => setClearanceOpen(false)}>Done</Button>
              </DialogFooter>
            </div>
          ) : (
            clearance && (
              <div className="space-y-3 text-sm">
                {!clearance.emailSent && (
                  <p className="rounded-md bg-amber-50 p-2 text-xs text-amber-700 dark:bg-amber-950/40 dark:text-amber-400">
                    The expiry date was saved, but the notification email could not be sent. Check
                    the SMTP settings.
                  </p>
                )}

                <div className="space-y-2">
                  <Label>Offer title</Label>
                  <Input
                    value={clearanceTitle}
                    onChange={(e) => setClearanceTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Discount %</Label>
                  <Input
                    type="number"
                    min={1}
                    max={99}
                    value={discountPercent}
                    onChange={(e) => {
                      const next = Number(e.target.value);
                      if (Number.isNaN(next)) return;
                      setDiscountPercent(Math.min(99, Math.max(0, next)));
                    }}
                  />
                  <p className="text-[11px] text-muted-foreground">
                    Badge will read “{discountPercent}% OFF”. The product discount is updated
                    when the offer is saved.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Starts</Label>
                    <Input
                      type="date"
                      value={clearanceStart}
                      onChange={(e) => setClearanceStart(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Ends</Label>
                    <Input
                      type="date"
                      value={clearanceEnd}
                      onChange={(e) => setClearanceEnd(e.target.value)}
                    />
                  </div>
                </div>

                {clearanceError && <p className="text-sm text-destructive">{clearanceError}</p>}
              </div>
            )
          )}

          {!clearanceDone && (
            <DialogFooter className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setClearanceOpen(false)}
                disabled={clearanceSaving}
              >
                Skip
              </Button>
              <Button onClick={submitClearanceOffer} disabled={clearanceSaving}>
                {clearanceSaving ? "Submitting..." : "Create Offer"}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
