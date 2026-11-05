"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@online-store/ui/sheet";
import { Button } from "@online-store/ui/button";
import {
  Bell,
  MapPin,
  Package,
  Settings2,
  Store as StoreIcon,
  Wallet,
} from "lucide-react";
import type { Store } from "./column";
import { storeDisplayName, storeLogo } from "./column";
import StatusBadge from "@/components/comman/status-badge";

type StoreDetailsSheetProps = {
  store: Store | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onManage: (store: Store) => void;
};

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="break-words text-sm">{value || "—"}</span>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon?: React.ReactNode;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-3">
      <p className="flex items-center gap-1.5 text-sm font-medium">
        {icon}
        {title}
      </p>
      {children}
    </div>
  );
}

export default function StoreDetailsSheet({
  store,
  open,
  onOpenChange,
  onManage,
}: StoreDetailsSheetProps) {
  if (!store) return null;

  const settings = store.vendorSettings;
  const logo = storeLogo(store);
  const location = [store.city, store.district, store.province, store.country]
    .filter(Boolean)
    .join(", ");

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Store Details</SheetTitle>
        </SheetHeader>

        <div className="mt-6 space-y-6">
          {/* Banner + identity */}
          <div className="overflow-hidden rounded-lg border">
            <div className="relative h-28 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400">
              {settings?.storeBanner ? (
                <img
                  src={settings.storeBanner}
                  alt={`${storeDisplayName(store)} banner`}
                  className="h-full w-full object-cover"
                />
              ) : null}
            </div>
            <div className="flex items-start gap-3 p-4">
              {logo ? (
                <img
                  src={logo}
                  alt={storeDisplayName(store)}
                  className="-mt-10 h-16 w-16 rounded-xl border-4 border-background bg-background object-cover"
                />
              ) : (
                <div className="-mt-10 flex h-16 w-16 items-center justify-center rounded-xl border-4 border-background bg-muted text-muted-foreground">
                  <StoreIcon className="h-6 w-6" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-lg font-semibold">
                  {storeDisplayName(store)}
                </p>
                <p className="truncate text-sm text-muted-foreground">
                  {store.name || "Vendor"} · Vendor #{store.id}
                </p>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <StatusBadge status={store.status} />
                  {location ? (
                    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />
                      {location}
                    </span>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="border-t p-4">
              <p className="text-sm text-muted-foreground">
                {settings?.description || "No store description yet."}
              </p>
            </div>
          </div>

          {/* Block/Cancel reason */}
          {(store.status === "BLOCKED" || store.status === "CANCELLED") && (
            <div className="space-y-1 rounded-md border border-red-200 bg-red-50 p-3 dark:border-red-900 dark:bg-red-950/30">
              <p className="text-xs font-medium text-red-600 dark:text-red-400">
                {store.status === "BLOCKED" ? "Block reason" : "Rejection reason"}
              </p>
              <p className="text-sm">{store.blockReason || "No reason provided"}</p>
              {store.blockedAt ? (
                <p className="text-xs text-muted-foreground">
                  {store.status === "BLOCKED" ? "Blocked" : "Rejected"} on{" "}
                  {new Date(store.blockedAt).toLocaleDateString()}
                </p>
              ) : null}
            </div>
          )}

          {/* Quick stats */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="rounded-md border p-3">
              <Package className="mx-auto h-4 w-4 text-fuchsia-500" />
              <p className="mt-1 text-lg font-semibold">
                {store.productsCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Products</p>
            </div>
            <div className="rounded-md border p-3">
              <Wallet className="mx-auto h-4 w-4 text-green-600" />
              <p className="mt-1 text-lg font-semibold">
                {store.payoutsCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Payouts</p>
            </div>
            <div className="rounded-md border p-3">
              <Bell className="mx-auto h-4 w-4 text-amber-500" />
              <p className="mt-1 text-lg font-semibold">
                {store.notificationsCount ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">Notifications</p>
            </div>
          </div>

          <Section title="Contact">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Email" value={store.email} />
              <Field label="Phone" value={store.phone} />
            </div>
          </Section>

          <Section title="Address">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Country" value={store.country} />
              <Field label="Province" value={store.province} />
              <Field label="District" value={store.district} />
              <Field label="City" value={store.city} />
            </div>
            <Field label="Full Address" value={store.address} />
          </Section>

          {settings ? (
            <>
              <Section
                icon={<StoreIcon className="h-3.5 w-3.5" />}
                title="Business"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Store Name" value={settings.storeName} />
                  <Field label="Tax ID" value={settings.taxId} />
                  <Field label="Business Reg" value={settings.businessReg} />
                </div>
              </Section>

              <Section
                icon={<Wallet className="h-3.5 w-3.5" />}
                title="Bank Details"
              >
                <div className="grid grid-cols-2 gap-4">
                  <Field label="Bank Name" value={settings.bankName} />
                  <Field label="Branch" value={settings.branch} />
                  <Field label="Account Name" value={settings.accountName} />
                  <Field label="Account No." value={settings.accountNumber} />
                </div>
              </Section>
            </>
          ) : (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              This vendor has not created a store profile yet.
            </div>
          )}

          <Button
            variant="outline"
            className="w-full"
            onClick={() => {
              onOpenChange(false);
              onManage(store);
            }}
          >
            <Settings2 className="mr-2 h-4 w-4" />
            Manage store status
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
