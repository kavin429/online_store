"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, type Store } from "./column";
import StoreDetailsSheet from "./details-sheet";
import ManageStatusDialog, {
  type StatusOption,
} from "@/components/comman/manage-status-dialog";

const storeStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "Set Pending", buttonVariant: "outline" },
  { value: "ACTIVE", label: "Activate", buttonVariant: "shoesecondary" },
  {
    value: "CANCELLED",
    label: "Reject",
    badgeLabel: "cancelled",
    requiresReason: true,
    buttonVariant: "destructive",
  },
  {
    value: "BLOCKED",
    label: "Block",
    requiresReason: true,
    buttonVariant: "destructive",
  },
];

export default function StoreMain({ data }: { data: Store[] }) {
  const [stores, setStores] = useState(data);
  const [viewingStore, setViewingStore] = useState<Store | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [manageTarget, setManageTarget] = useState<Store | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  const handleView = (store: Store) => {
    setViewingStore(store);
    setSheetOpen(true);
  };

  const handleManage = (store: Store) => {
    setManageTarget(store);
    setManageOpen(true);
  };

  const handleStatusChange = async (
    store: Store,
    status: string,
    reason?: string,
  ) => {
    const res = await fetch(`/api/vendors/${store.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        status === "BLOCKED" || status === "CANCELLED"
          ? { status, reason }
          : { status },
      ),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update store status");
    }

    return res.json();
  };

  const handleStatusChanged = (updated: Store) => {
    setStores((prev) =>
      prev.map((store) =>
        store.id === updated.id ? { ...store, ...updated } : store,
      ),
    );
    setViewingStore((current) =>
      current && current.id === updated.id ? { ...current, ...updated } : current,
    );
  };

  return (
    <div className="space-y-4 p-6">
      <div>
        <h1 className="text-2xl font-bold">Stores</h1>
        <p className="text-sm text-muted-foreground">
          Vendor storefront profiles and their public store details.
        </p>
      </div>

      <DataTable
        columns={columns(handleView, handleManage)}
        data={stores}
        filterBy="storeName"
      />

      <StoreDetailsSheet
        store={viewingStore}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        onManage={handleManage}
      />

      <ManageStatusDialog
        entity={manageTarget}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onStatusChange={handleStatusChange}
        onUpdated={handleStatusChanged}
        entityLabel="store"
        statusOptions={storeStatusOptions}
      />
    </div>
  );
}
