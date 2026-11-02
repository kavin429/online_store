"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  Check,
  ChevronDown,
  Truck,
} from "lucide-react";
import { Button } from "@online-store/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { useCart } from "@/context/addToCard";
import { TIMELINE, TIMELINE_INDEX } from "./constants";
import { money, orderTotal } from "./helpers";
import { ReturnDialog } from "./ReturnDialog";
import type { OrderView } from "./types";
import { StatusBadge, mutedCls } from "./ui";

export function OrderCard({
  order: o,
  expanded,
  onToggle,
}: {
  order: OrderView;
  expanded: boolean;
  onToggle: () => void;
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [cancelOpen, setCancelOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const step = TIMELINE_INDEX[o.status];
  const subtotal = o.items.reduce((s, i) => s + i.price * i.qty, 0);
  const canTrack = !!o.tracking || ["Shipped", "Out for delivery", "Delivered"].includes(o.status);

  const cancelOrder = async () => {
    setBusy(true);
    try {
      const res = await fetch(`/api/orders/${o.dbId}/cancel`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not cancel this order.");
      toast.success("Order cancelled.");
      setCancelOpen(false);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not cancel this order.");
    } finally {
      setBusy(false);
    }
  };

  const trackOrder = async () => {
    if (o.tracking) {
      try {
        await navigator.clipboard.writeText(o.tracking);
        toast.success(`Tracking ${o.tracking} copied.`);
      } catch {
        toast.success(`Tracking number: ${o.tracking}`);
      }
      return;
    }
    toast.info("Tracking becomes available once the order ships.");
  };

  const buyAgain = () => {
    let added = 0;
    for (const item of o.items) {
      const result = addToCart({
        id: item.productId,
        name: item.name,
        sellingPrice: item.price,
        quantity: item.qty,
        variantId: item.productVariantId,
      });
      if (result.ok) added += 1;
    }
    if (added === 0) {
      toast.error("These items are not available right now.");
      return;
    }
    toast.success(`${added} item${added === 1 ? "" : "s"} added to your cart.`);
    router.push("/cart");
  };

  return (
    <div className="rounded-lg border border-fuchsia-100 dark:border-fuchsia-900/40">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between gap-3 p-3 text-left sm:p-4"
      >
        <div className="min-w-0">
          <div className="text-sm font-semibold">{o.id}</div>
          <div className={mutedCls}>
            {o.date} · {o.items.length} item{o.items.length > 1 ? "s" : ""}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <StatusBadge status={o.status} />
          <span className="hidden text-sm font-semibold sm:inline">{money(orderTotal(o))}</span>
          <ChevronDown
            className={`h-4 w-4 text-fuchsia-500 transition-transform ${expanded ? "rotate-180" : ""}`}
          />
        </div>
      </button>

      {expanded && (
        <div className="space-y-5 border-t border-fuchsia-100 bg-fuchsia-50/40 p-3 sm:p-4 dark:border-fuchsia-900/40 dark:bg-fuchsia-950/10">
          {o.returnStatus && (
            <div className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
              Return request: <b>{o.returnStatus}</b>
            </div>
          )}

          {step !== undefined ? (
            <ol className="flex flex-col gap-3 sm:flex-row">
              {TIMELINE.map((label, i) => {
                const done = i <= step;
                return (
                  <li
                    key={label}
                    className="flex items-center gap-2 sm:flex-1 sm:flex-col sm:text-center"
                  >
                    <span
                      className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs ${
                        done
                          ? "bg-fuchsia-600 text-white"
                          : "bg-fuchsia-100 text-fuchsia-400 dark:bg-fuchsia-950/50"
                      }`}
                    >
                      {done ? <Check className="h-3.5 w-3.5" /> : i + 1}
                    </span>
                    <span className={`text-xs ${done ? "font-medium" : "text-fuchsia-700/60"}`}>
                      {label}
                    </span>
                  </li>
                );
              })}
            </ol>
          ) : (
            <p className="text-sm font-medium">{o.eta}</p>
          )}

          <ul className="divide-y divide-fuchsia-100 dark:divide-fuchsia-900/30">
            {o.items.map((i, index) => (
              <li
                key={`${i.productId}-${i.productVariantId ?? "base"}-${index}`}
                className="flex justify-between gap-3 py-2 text-sm"
              >
                <div>
                  <div className="font-medium">{i.name}</div>
                  <div className={mutedCls}>
                    {i.variant ? `${i.variant} · ` : ""}Qty {i.qty}
                  </div>
                </div>
                <div className="font-medium">{money(i.price * i.qty)}</div>
              </li>
            ))}
          </ul>

          <div className="grid gap-4 sm:grid-cols-2">
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className={mutedCls}>Subtotal</dt>
                <dd>{money(subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className={mutedCls}>Shipping</dt>
                <dd>{o.shipping === 0 ? "Free" : money(o.shipping)}</dd>
              </div>
              {o.discount > 0 && (
                <div className="flex justify-between text-green-700 dark:text-green-400">
                  <dt>Promo {o.promo && `(${o.promo})`}</dt>
                  <dd>-{money(o.discount)}</dd>
                </div>
              )}
              <div className="flex justify-between border-t border-fuchsia-200 pt-1 font-semibold dark:border-fuchsia-900/50">
                <dt>Total</dt>
                <dd>{money(orderTotal(o))}</dd>
              </div>
            </dl>

            <div className="space-y-1 text-sm">
              <div>
                <span className={mutedCls}>Payment: </span>
                {o.payment}
              </div>
              <div>
                <span className={mutedCls}>Ship to: </span>
                {o.address}
              </div>
              {o.eta && (
                <div>
                  <span className={mutedCls}>Delivery: </span>
                  {o.eta}
                </div>
              )}
              {o.tracking && (
                <div>
                  <span className={mutedCls}>Tracking: </span>
                  {o.tracking}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {canTrack && (
              <Button size="sm" onClick={trackOrder} disabled={busy}>
                <Truck className="mr-1.5 h-4 w-4" /> Track order
              </Button>
            )}
            {o.canCancel && (
              <Button
                size="sm"
                variant="delete"
                onClick={() => setCancelOpen(true)}
                disabled={busy}
              >
                Cancel order
              </Button>
            )}
            {o.canReturn && (
              <Button size="sm" variant="outline" onClick={() => setReturnOpen(true)} disabled={busy}>
                Return item
              </Button>
            )}
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                window.open(`/api/orders/${o.dbId}/invoice`, "_blank", "noopener,noreferrer")
              }
            >
              Invoice
            </Button>
            <Button size="sm" variant="ghost" onClick={buyAgain} disabled={busy}>
              Buy again
            </Button>
          </div>
        </div>
      )}

      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel {o.id}?</DialogTitle>
            <DialogDescription>
              This will cancel the order and return the items to stock. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCancelOpen(false)} disabled={busy}>
              Keep order
            </Button>
            <Button variant="destructive" onClick={cancelOrder} disabled={busy}>
              {busy ? "Cancelling..." : "Cancel order"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ReturnDialog
        orderId={o.dbId}
        open={returnOpen}
        onOpenChange={setReturnOpen}
        onDone={() => router.refresh()}
      />
    </div>
  );
}
