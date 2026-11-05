"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Textarea } from "@online-store/ui/textarea";
import { toast } from "sonner";
import type { Quotation } from "@/lib/types";
import {
  QUOTATION_STATUS_LABELS,
  QUOTATION_STATUS_TONES,
  columns,
  formatDate,
  formatMoney,
  quotationRef,
} from "./column";

type Props = { data: Quotation[] };

function todayInputValue() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate(),
  ).padStart(2, "0")}`;
}

function toInputDate(value: string | null | undefined) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(
    2,
    "0",
  )}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export default function VendorQuotationMain({ data }: Props) {
  const [quotations, setQuotations] = useState<Quotation[]>(data);
  const [viewing, setViewing] = useState<Quotation | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  const [prices, setPrices] = useState<Record<number, string>>({});
  const [note, setNote] = useState("");
  const [pickupDate, setPickupDate] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewing) return;
    setNote("");
    setError(null);
    setPickupDate(toInputDate(viewing.pickupDate) || todayInputValue());

    const next: Record<number, string> = {};
    for (const item of viewing.items ?? []) {
      next[item.id] =
        item.quotedUnitPrice != null
          ? String(item.quotedUnitPrice)
          : item.requestedUnitPrice != null
            ? String(item.requestedUnitPrice)
            : "";
    }
    setPrices(next);
  }, [viewing]);

  const refresh = async () => {
    try {
      const res = await fetch("/api/quotations");
      if (!res.ok) return;
      const json = await res.json();
      setQuotations(json.data ?? []);
    } catch (err) {
      console.error("Failed to refresh quotations", err);
    }
  };

  const handleView = (quotation: Quotation) => {
    setViewing(quotation);
    setViewOpen(true);
  };

  const run = async (action: string, extra: Record<string, unknown> = {}) => {
    if (!viewing) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch(`/api/quotations/${viewing.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, note, ...extra }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to update quotation");

      const updated = body.data as Quotation;
      setQuotations((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item)),
      );
      setViewing(updated);
      toast.success("Quotation updated");
    } catch (err: any) {
      setError(err.message || "Failed to update quotation.");
      toast.error(err.message || "Failed to update quotation.");
    } finally {
      setSaving(false);
    }
  };

  const submitQuote = () => {
    if (!viewing) return;
    const items = viewing.items.map((item) => {
      const raw = prices[item.id];
      const price = Number(raw);
      return { id: item.id, quotedUnitPrice: raw, price };
    });

    for (const item of items) {
      if (item.quotedUnitPrice === "" || Number.isNaN(item.price) || item.price < 0) {
        setError("Enter a valid unit price for every item.");
        return;
      }
    }

    run("submit_quote", {
      items: items.map(({ id, price }) => ({ id, quotedUnitPrice: price })),
    });
  };

  const quotedPreview = viewing
    ? viewing.items.reduce((sum, item) => {
        const price = Number(prices[item.id]);
        return sum + (Number.isFinite(price) ? price * item.quantity : 0);
      }, 0)
    : 0;

  const canQuote =
    viewing && ["REQUESTED", "QUOTED"].includes(viewing.status);
  const canSetPickup =
    viewing && ["ACCEPTED", "READY_FOR_PICKUP"].includes(viewing.status);

  return (
    <div className="p-6 space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Quotations</h1>
        <p className="text-sm text-muted-foreground">
          Stock price requests from the admin. Send your price or set a pickup date.
        </p>
      </div>

      <DataTable columns={columns(handleView)} data={quotations} filterBy="status" />

      <Dialog
        open={viewOpen}
        onOpenChange={(open) => {
          setViewOpen(open);
          if (!open) void refresh();
        }}
      >
        <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
          {viewing && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2">
                  <DialogTitle>{quotationRef(viewing.id)}</DialogTitle>
                  <span
                    className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                      QUOTATION_STATUS_TONES[viewing.status]
                    }`}
                  >
                    {QUOTATION_STATUS_LABELS[viewing.status]}
                  </span>
                </div>
                <DialogDescription>
                  Stock quotation request from the admin.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 text-sm">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Info label="Quoted total" value={
                    viewing.quotedTotal > 0 ? formatMoney(viewing.quotedTotal) : "Not quoted"
                  } />
                  <Info label="Pickup date" value={formatDate(viewing.pickupDate)} />
                  <Info label="Requested" value={new Date(viewing.createdAt).toLocaleString()} />
                  <Info label="Driver" value={viewing.driver?.name ?? "Not assigned"} />
                </div>

                {(viewing.requestNote || viewing.adminNote || viewing.rejectionReason) && (
                  <div className="space-y-2 rounded-lg border p-3">
                    {viewing.requestNote && (
                      <Note label="Admin note" value={viewing.requestNote} />
                    )}
                    {viewing.adminNote && (
                      <Note label="Admin response" value={viewing.adminNote} />
                    )}
                    {viewing.rejectionReason && (
                      <Note label="Rejection reason" value={viewing.rejectionReason} />
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
                          <th className="px-3 py-2 text-right font-medium">
                            {canQuote ? "Your unit price" : "Your price"}
                          </th>
                          <th className="px-3 py-2 text-right font-medium">Line total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {viewing.items.map((item) => {
                          const price = Number(prices[item.id]);
                          return (
                            <tr key={item.id} className="border-t">
                              <td className="px-3 py-2">{item.name}</td>
                              <td className="px-3 py-2 text-center">{item.quantity}</td>
                              <td className="px-3 py-2 text-right">
                                {item.requestedUnitPrice != null
                                  ? formatMoney(item.requestedUnitPrice)
                                  : "—"}
                              </td>
                              <td className="px-3 py-2 text-right">
                                {canQuote ? (
                                  <Input
                                    type="number"
                                    min={0}
                                    step="0.01"
                                    value={prices[item.id] ?? ""}
                                    onChange={(event) =>
                                      setPrices((prev) => ({
                                        ...prev,
                                        [item.id]: event.target.value,
                                      }))
                                    }
                                    className="ml-auto h-8 w-24 text-right"
                                    disabled={saving}
                                  />
                                ) : item.quotedUnitPrice != null ? (
                                  formatMoney(item.quotedUnitPrice)
                                ) : (
                                  "—"
                                )}
                              </td>
                              <td className="px-3 py-2 text-right font-medium">
                                {Number.isFinite(price) && price >= 0
                                  ? formatMoney(price * item.quantity)
                                  : "—"}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                  {canQuote && (
                    <p className="text-right text-xs text-muted-foreground">
                      Quotation total:{" "}
                      <span className="font-semibold text-foreground">
                        {formatMoney(quotedPreview)}
                      </span>
                    </p>
                  )}
                </div>

                {(canQuote || canSetPickup) && (
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor-note">Note for the admin (optional)</Label>
                    <Textarea
                      id="vendor-note"
                      value={note}
                      onChange={(event) => setNote(event.target.value)}
                      rows={2}
                      placeholder={
                        canQuote
                          ? "Availability, quality notes, or counter-offer details…"
                          : "Pickup instructions for the driver…"
                      }
                      disabled={saving}
                    />
                  </div>
                )}

                {canQuote && (
                  <div className="flex flex-wrap gap-2">
                    <Button onClick={submitQuote} disabled={saving}>
                      {saving ? "Saving…" : "Send quotation"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => {
                        if (window.confirm("Reject this stock request?")) {
                          run("reject");
                        }
                      }}
                      disabled={saving}
                    >
                      Reject request
                    </Button>
                  </div>
                )}

                {canSetPickup && (
                  <div className="space-y-2">
                    <p className="text-xs text-muted-foreground">
                      The admin accepted the quotation. Choose the date the stock will be
                      ready for pickup.
                    </p>
                    <div className="flex flex-wrap items-end gap-2">
                      <div className="space-y-1.5">
                        <Label htmlFor="pickup-date">Pickup date</Label>
                        <Input
                          id="pickup-date"
                          type="date"
                          min={todayInputValue()}
                          value={pickupDate}
                          onChange={(event) => setPickupDate(event.target.value)}
                          disabled={saving}
                        />
                      </div>
                      <Button
                        onClick={() => run("set_pickup_date", { pickupDate })}
                        disabled={saving || !pickupDate}
                      >
                        {saving ? "Saving…" : "Save pickup date"}
                      </Button>
                    </div>
                  </div>
                )}

                {["READY_FOR_PICKUP", "DRIVER_ASSIGNED", "PICKED_UP", "RECEIVED"].includes(
                  viewing.status,
                ) && (
                  <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                    {viewing.status === "READY_FOR_PICKUP"
                      ? "Waiting for the admin to assign a driver."
                      : viewing.status === "DRIVER_ASSIGNED"
                        ? `${viewing.driver?.name ?? "A driver"} will collect the stock on ${formatDate(
                            viewing.pickupDate,
                          )}.`
                        : viewing.status === "PICKED_UP"
                          ? "The stock has been picked up and is on its way to the store."
                          : "Completed — the stock was received and added back to inventory."}
                  </p>
                )}

                {viewing.status === "REJECTED" && (
                  <p className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    This request was rejected.
                  </p>
                )}

                {viewing.status === "CANCELLED" && (
                  <p className="rounded-md bg-muted/60 p-2 text-xs text-muted-foreground">
                    The admin cancelled this request.
                  </p>
                )}

                {error && (
                  <p className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
                    {error}
                  </p>
                )}

                {viewing.events.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Tracking</p>
                    {viewing.events.map((event) => (
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
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setViewOpen(false)}>
                  Close
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
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
