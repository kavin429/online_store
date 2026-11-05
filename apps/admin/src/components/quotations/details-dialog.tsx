"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Label } from "@online-store/ui/label";
import { Textarea } from "@online-store/ui/textarea";
import { toast } from "sonner";
import type { Driver, Quotation } from "@/lib/types";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_TONES,
  formatDate,
  formatMoney,
  quotationRef,
} from "./column";

type Props = {
  quotation: Quotation | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  drivers: Driver[];
  onUpdated: (quotation: Quotation) => void;
};

export default function QuotationDetailsDialog({
  quotation,
  open,
  onOpenChange,
  drivers,
  onUpdated,
}: Props) {
  const [note, setNote] = useState("");
  const [driverId, setDriverId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setNote("");
    setError(null);
    setDriverId(quotation?.driverId ? String(quotation.driverId) : "");
  }, [quotation]);

  if (!quotation) return null;

  const activeDrivers = drivers.filter((driver) => driver.status === "ACTIVE");

  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotations/${quotation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, ...extra }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to update quotation");

      onUpdated(body.data as Quotation);
      setNote("");
      toast.success("Quotation updated");
    } catch (err: any) {
      setError(err.message || "Failed to update quotation.");
      toast.error(err.message || "Failed to update quotation.");
    } finally {
      setSaving(false);
    }
  };

  const canCancel = ["REQUESTED", "QUOTED", "ACCEPTED", "READY_FOR_PICKUP"].includes(
    quotation.status,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{quotationRef(quotation.id)}</DialogTitle>
            <span
              className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                QUOTATION_STATUS_TONES[quotation.status]
              }`}
            >
              {QUOTATION_STATUS_LABELS[quotation.status]}
            </span>
          </div>
          <DialogDescription>
            Stock purchase request for {quotation.vendor?.name ?? "the vendor"}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="grid gap-3 sm:grid-cols-2">
            <Info label="Vendor" value={quotation.vendor?.name} />
            <Info label="Vendor email" value={quotation.vendor?.email} />
            <Info
              label="Quoted total"
              value={
                quotation.quotedTotal > 0 ? formatMoney(quotation.quotedTotal) : "Not quoted"
              }
            />
            <Info label="Pickup date" value={formatDate(quotation.pickupDate)} />
            <Info label="Driver" value={quotation.driver?.name ?? "Not assigned"} />
            <Info
              label="Requested"
              value={new Date(quotation.createdAt).toLocaleString()}
            />
          </div>

          {(quotation.requestNote || quotation.vendorNote || quotation.rejectionReason) && (
            <div className="space-y-2 rounded-lg border p-3">
              {quotation.requestNote && (
                <Note label="Admin request note" value={quotation.requestNote} />
              )}
              {quotation.vendorNote && (
                <Note label="Vendor note" value={quotation.vendorNote} />
              )}
              {quotation.rejectionReason && (
                <Note label="Rejection reason" value={quotation.rejectionReason} />
              )}
            </div>
          )}

          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Items</p>
            <div className="overflow-hidden rounded-lg border">
              <table className="w-full text-xs">
                <thead className="bg-muted/60 text-muted-foreground">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium">Item</th>
                    <th className="px-3 py-2 text-center font-medium">Qty</th>
                    <th className="px-3 py-2 text-right font-medium">Target</th>
                    <th className="px-3 py-2 text-right font-medium">Quoted</th>
                    <th className="px-3 py-2 text-right font-medium">Line total</th>
                  </tr>
                </thead>
                <tbody>
                  {quotation.items.map((item) => (
                    <tr key={item.id} className="border-t">
                      <td className="px-3 py-2">{item.name}</td>
                      <td className="px-3 py-2 text-center">{item.quantity}</td>
                      <td className="px-3 py-2 text-right">
                        {item.requestedUnitPrice != null
                          ? formatMoney(item.requestedUnitPrice)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {item.quotedUnitPrice != null
                          ? formatMoney(item.quotedUnitPrice)
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {item.quotedUnitPrice != null
                          ? formatMoney(item.quotedUnitPrice * item.quantity)
                          : "—"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Action panel */}
          <div className="space-y-3 rounded-lg border border-fuchsia-100 p-3 dark:border-fuchsia-900/40">
            <p className="font-semibold">Next step</p>

            {["QUOTED", "READY_FOR_PICKUP", "DRIVER_ASSIGNED", "PICKED_UP"].includes(
              quotation.status,
            ) && (
              <div className="space-y-1.5">
                <Label htmlFor="quotation-action-note">
                  {quotation.status === "QUOTED"
                    ? "Note / rejection reason (optional)"
                    : "Note (optional)"}
                </Label>
                <Textarea
                  id="quotation-action-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  rows={2}
                  placeholder="Visible to the vendor"
                  disabled={saving}
                />
              </div>
            )}

            {quotation.status === "REQUESTED" && (
              <p className="text-xs text-muted-foreground">
                Waiting for the vendor to send a quotation. You can cancel the
                request below.
              </p>
            )}

            {quotation.status === "QUOTED" && (
              <div className="flex flex-wrap gap-2">
                <Button onClick={() => run("accept")} disabled={saving}>
                  {saving ? "Saving…" : "Accept quotation"}
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => {
                    if (
                      window.confirm(
                        "Reject this quotation? The vendor will be notified.",
                      )
                    ) {
                      run("reject");
                    }
                  }}
                  disabled={saving}
                >
                  Reject quotation
                </Button>
              </div>
            )}

            {quotation.status === "ACCEPTED" && (
              <p className="text-xs text-muted-foreground">
                Quotation accepted. Waiting for the vendor to give the pickup date.
              </p>
            )}

            {quotation.status === "READY_FOR_PICKUP" && (
              <div className="space-y-2">
                <div className="space-y-1.5">
                  <Label htmlFor="quotation-driver">Assign a driver for pickup</Label>
                  <select
                    id="quotation-driver"
                    value={driverId}
                    onChange={(event) => setDriverId(event.target.value)}
                    className="w-full rounded border bg-background p-2"
                    disabled={saving}
                  >
                    <option value="">Choose driver</option>
                    {activeDrivers.map((driver) => (
                      <option key={driver.id} value={driver.id}>
                        {driver.name} ({driver.username})
                        {driver.isAvailable ? "" : " - busy"}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  onClick={() =>
                    run("assign_driver", {
                      driverId: driverId ? Number(driverId) : null,
                    })
                  }
                  disabled={saving || !driverId}
                >
                  {saving ? "Saving…" : "Assign driver"}
                </Button>
              </div>
            )}

            {quotation.status === "DRIVER_ASSIGNED" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  {quotation.driver?.name ?? "The driver"} is collecting the stock on{" "}
                  {formatDate(quotation.pickupDate)}. Mark it picked up once the stock
                  leaves the vendor.
                </p>
                <Button onClick={() => run("mark_picked_up")} disabled={saving}>
                  {saving ? "Saving…" : "Mark picked up"}
                </Button>
              </div>
            )}

            {quotation.status === "PICKED_UP" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">
                  The stock was picked up. Mark it received to add the quantities back
                  into inventory.
                </p>
                <Button
                  onClick={() => {
                    if (
                      window.confirm(
                        "Mark this order received? Stock quantities will be added back to inventory.",
                      )
                    ) {
                      run("mark_received");
                    }
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving…" : "Mark received & restore stock"}
                </Button>
              </div>
            )}

            {quotation.status === "RECEIVED" && (
              <p className="text-xs text-green-600 dark:text-green-400">
                Completed — the stock was received and inventory was restored.
              </p>
            )}

            {quotation.status === "REJECTED" && (
              <p className="text-xs text-red-600 dark:text-red-400">
                This quotation was rejected.
              </p>
            )}

            {quotation.status === "CANCELLED" && (
              <p className="text-xs text-muted-foreground">
                This quotation was cancelled.
              </p>
            )}

            {canCancel && (
              <Button
                variant="outline"
                onClick={() => {
                  if (window.confirm("Cancel this quotation request?")) {
                    run("cancel");
                  }
                }}
                disabled={saving}
              >
                Cancel request
              </Button>
            )}

            {error && (
              <p className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
                {error}
              </p>
            )}
          </div>

          {quotation.events?.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">Tracking</p>
              <div className="space-y-2">
                {quotation.events.map((event) => (
                  <div key={event.id} className="rounded-md border p-2 text-xs">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-medium">{event.title}</span>
                      <span className="text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>
                    {event.message && (
                      <p className="mt-0.5 text-muted-foreground">{event.message}</p>
                    )}
                    <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
                      {event.actor}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Info({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="break-words text-sm">{value || "—"}</p>
    </div>
  );
}

function Note({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="whitespace-pre-wrap text-sm">{value}</p>
    </div>
  );
}
