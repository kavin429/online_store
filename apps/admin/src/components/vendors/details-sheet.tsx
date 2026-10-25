"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@online-store/ui/sheet";
import { Badge } from "@online-store/ui/badge";
import {
  Ban,
  CheckCircle2,
  Package,
  Wallet,
  Store,
  Bell,
} from "lucide-react";
import type { Vendor } from "./column";

type VendorDetailsSheetProps = {
  vendor: Vendor | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-sm break-words">{value || "—"}</span>
    </div>
  );
}

function Section({ icon, title, children }: { icon?: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-medium flex items-center gap-1.5">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

export default function VendorDetailsSheet({
  vendor,
  open,
  onOpenChange,
}: VendorDetailsSheetProps) {
  if (!vendor) return null;

  const settings = vendor.vendorSettings;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Vendor Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Header: name + status */}
          <div className="flex items-center gap-4">
            {(vendor.image || settings?.storeLogo) ? (
              <img
                src={vendor.image || settings?.storeLogo as string}
                alt={vendor.name ?? "Vendor"}
                className="w-16 h-16 rounded-full object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center text-lg font-medium text-muted-foreground">
                {(vendor.name || "?")[0]?.toUpperCase()}
              </div>
            )}
            <div>
              <p className="font-semibold text-lg">{vendor.name || "—"}</p>
              <p className="text-sm text-muted-foreground">
                {settings?.storeName || "Store not set up"}
              </p>
              <div className="mt-1">
                {vendor.status === "BLOCKED" ? (
                  <Badge className="gap-1 bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90">
                    <Ban className="w-3 h-3" /> Blocked
                  </Badge>
                ) : (
                  <Badge className="gap-1 bg-green-600 hover:bg-green-600">
                    <CheckCircle2 className="w-3 h-3" /> Active
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Block reason */}
          {vendor.status === "BLOCKED" && (
            <div className="rounded-md border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/30 p-3 space-y-1">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                Block reason
              </p>
              <p className="text-sm">{vendor.blockReason || "No reason provided"}</p>
              {vendor.blockedAt && (
                <p className="text-xs text-muted-foreground">
                  Blocked on {new Date(vendor.blockedAt).toLocaleDateString()}
                </p>
              )}
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border p-3">
              <Package className="w-4 h-4 mx-auto text-fuchsia-500" />
              <p className="mt-1 text-lg font-semibold">{vendor.productsCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
            <div className="rounded-md border p-3">
              <Wallet className="w-4 h-4 mx-auto text-green-600" />
              <p className="mt-1 text-lg font-semibold">{vendor.payoutsCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Payouts</p>
            </div>
            <div className="rounded-md border p-3">
              <Bell className="w-4 h-4 mx-auto text-amber-500" />
              <p className="mt-1 text-lg font-semibold">{vendor.notificationsCount ?? 0}</p>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </div>
          </div>

          {/* Contact */}
          <Section title="Contact">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={vendor.email} />
              <Field label="Phone" value={vendor.phone} />
            </div>
          </Section>

          {/* Address */}
          <Section title="Address">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country" value={vendor.country} />
              <Field label="Province" value={vendor.province} />
              <Field label="District" value={vendor.district} />
              <Field label="City" value={vendor.city} />
            </div>
            <Field label="Full Address" value={vendor.address} />
          </Section>

          {/* Store settings */}
          {settings && (
            <>
              <Section icon={<Store className="w-3.5 h-3.5" />} title="Store">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Store Name" value={settings.storeName} />
                  <Field label="Description" value={settings.description} />
                  <Field label="Tax ID" value={settings.taxId} />
                  <Field label="Business Reg" value={settings.businessReg} />
                </div>
              </Section>

              <Section icon={<Wallet className="w-3.5 h-3.5" />} title="Bank Details">
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank Name" value={settings.bankName} />
                  <Field label="Branch" value={settings.branch} />
                  <Field label="Account Name" value={settings.accountName} />
                  <Field label="Account No." value={settings.accountNumber} />
                </div>
              </Section>
            </>
          )}

          {/* Account */}
          <Section title="Account">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Vendor ID" value={String(vendor.id)} />
              <Field
                label="Joined"
                value={new Date(vendor.createdAt).toLocaleDateString()}
              />
            </div>
          </Section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
