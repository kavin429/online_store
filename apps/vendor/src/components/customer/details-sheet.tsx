"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@online-store/ui/sheet";
import type { Customer } from "./column";
import StatusBadge from "@/components/comman/status-badge";

type CustomerDetailsSheetProps = {
  customer: Customer | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm">{value || "—"}</span>
    </div>
  );
}

export default function CustomerDetailsSheet({
  customer,
  open,
  onOpenChange,
}: CustomerDetailsSheetProps) {
  if (!customer) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Customer Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          <div className="flex items-center gap-4">
            {customer.image ? (
              <img
                src={customer.image}
                alt={customer.name ?? "Customer"}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                {(customer.name || customer.username || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{customer.name || "—"}</p>
              {customer.username && (
                <p className="text-sm text-muted-foreground">@{customer.username}</p>
              )}
              <div className="mt-1">
                <StatusBadge status={customer.status === "BLOCKED" ? "blocked" : "active"} />
              </div>
            </div>
          </div>

          {customer.status === "BLOCKED" && (
            <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-1">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Block reason
              </p>
              <p className="text-sm">{customer.blockReason || "No reason provided"}</p>
              {customer.blockedAt && (
                <p className="text-xs text-muted-foreground">
                  Blocked on {new Date(customer.blockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          <div className="space-y-4">
            <p className="text-sm font-medium">Contact</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={customer.email} />
              <Field label="Phone" value={customer.phone} />
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Address</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country" value={customer.country} />
              <Field label="Province" value={customer.province} />
              <Field label="District" value={customer.district} />
              <Field label="City" value={customer.city} />
            </div>
            <Field label="Full Address" value={customer.address} />
          </div>

          <div className="space-y-4">
            <p className="text-sm font-medium">Account</p>
            <div className="grid grid-cols-2 gap-4">
              <Field label="Customer ID" value={String(customer.id)} />
              <Field
                label="Joined"
                value={new Date(customer.createdAt).toLocaleDateString()}
              />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}