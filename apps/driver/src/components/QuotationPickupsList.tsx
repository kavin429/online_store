"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card } from "@online-store/ui/card";
import { Button } from "@online-store/ui/button";
import { toast } from "sonner";
import { ArrowUpRight, MapPin, Navigation, Package, Phone } from "lucide-react";
import { StatusBadge } from "@online-store/ui/status-badge";
import { formatLKR } from "@/lib/utils";

type QuotationItem = {
  id: number;
  name: string;
  quantity: number;
};

export type DriverQuotation = {
  id: number;
  status: string;
  pickupDate: string | null;
  quotedTotal: number;
  assignedAt: string | null;
  vendor: { name: string; phone: string; address: string | null; city: string | null };
  items: QuotationItem[];
};

function quotationRef(id: number) {
  return `QT-${String(id).padStart(5, "0")}`;
}

function directionsUrl(address: string) {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`;
}

export default function QuotationPickupsList({
  quotations,
}: {
  quotations: DriverQuotation[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<number | null>(null);

  const markPickedUp = async (id: number) => {
    setBusyId(id);
    try {
      const res = await fetch(`/api/quotations/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_picked_up" }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not update pickup");
      toast.success("Marked as picked up");
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || "Could not update pickup");
    } finally {
      setBusyId(null);
    }
  };

  if (quotations.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold tracking-tight">Stock pickups</h2>
        <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
          {quotations.length} waiting
        </span>
      </div>

      {quotations.map((q) => {
        const address = [q.vendor.address, q.vendor.city].filter(Boolean).join(", ");

        return (
          <Card
            key={q.id}
            className="overflow-hidden rounded-2xl border-fuchsia-100/70 transition hover:shadow-md dark:border-fuchsia-900/30"
          >
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-fuchsia-100/70 bg-amber-50/60 p-4 dark:border-fuchsia-900/30 dark:bg-amber-950/10">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-amber-600 shadow-sm dark:bg-neutral-900 dark:text-amber-300">
                  <Package className="h-5 w-5" />
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/dashboard/pickups/${q.id}`}
                    className="font-semibold hover:underline"
                  >
                    {quotationRef(q.id)}
                  </Link>
                  <StatusBadge status={q.status} />
                </div>
              </div>
              {q.pickupDate && (
                <p className="text-xs text-muted-foreground">
                  Pickup date: {new Date(q.pickupDate).toLocaleDateString()}
                </p>
              )}
            </div>

            <div className="grid gap-4 p-4 md:grid-cols-2">
              <div className="space-y-2">
                <p className="font-medium">{q.vendor.name}</p>
                {address && (
                  <p className="flex items-start gap-1.5 text-sm text-muted-foreground">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-fuchsia-500" />
                    <span>{address}</span>
                  </p>
                )}
                <div className="flex flex-wrap gap-2 pt-1">
                  {q.vendor.phone && (
                    <a href={`tel:${q.vendor.phone}`}>
                      <Button variant="outline" size="sm">
                        <Phone className="mr-1 h-4 w-4" /> Call vendor
                      </Button>
                    </a>
                  )}
                  {address && (
                    <a href={directionsUrl(address)} target="_blank" rel="noreferrer">
                      <Button variant="outline" size="sm">
                        <Navigation className="mr-1 h-4 w-4" /> Navigate
                      </Button>
                    </a>
                  )}
                  <Link href={`/dashboard/pickups/${q.id}`}>
                    <Button variant="ghost" size="sm">
                      Details <ArrowUpRight className="ml-1 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>

              <div className="space-y-1 rounded-xl bg-gray-50 p-3 dark:bg-neutral-900">
                {q.items.slice(0, 3).map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="truncate text-muted-foreground">
                      {item.name} × {item.quantity}
                    </span>
                  </div>
                ))}
                {q.items.length > 3 && (
                  <p className="text-xs text-muted-foreground">
                    + {q.items.length - 3} more item(s)
                  </p>
                )}
                <p className="pt-1 text-sm font-medium">{formatLKR(q.quotedTotal)}</p>
              </div>
            </div>

            <div className="border-t border-fuchsia-100/70 p-4 dark:border-fuchsia-900/30">
              <Button size="sm" disabled={busyId === q.id} onClick={() => markPickedUp(q.id)}>
                {busyId === q.id ? "Saving..." : "Mark picked up"}
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
