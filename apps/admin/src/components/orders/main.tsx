"use client";

import { useEffect, useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Order, OrderStatus } from "./column";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import { DeliveryStatus, Driver } from "@/lib/types";
import { toast } from "sonner";

const STATUS_OPTIONS: OrderStatus[] = [
  "PENDING",
  "CONFIRMED",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
];

const DELIVERY_OPTIONS: DeliveryStatus[] = [
  "UNASSIGNED",
  "ASSIGNED",
  "PICKED_UP",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "FAILED",
  "CANCELLED",
];

const DELIVERY_LABELS: Record<DeliveryStatus, string> = {
  UNASSIGNED: "Unassigned",
  ASSIGNED: "Driver assigned",
  PICKED_UP: "Picked up",
  OUT_FOR_DELIVERY: "Out for delivery",
  DELIVERED: "Delivered",
  FAILED: "Failed",
  CANCELLED: "Cancelled",
};

export default function OrderMain({
  data,
  embedded = false,
}: {
  data: Order[];
  embedded?: boolean;
}) {
  const [orders, setOrders] = useState<Order[]>(data);

  // View details
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Change order status
  const [statusTarget, setStatusTarget] = useState<Order | null>(null);
  const [statusOpen, setStatusOpen] = useState(false);
  const [statusValue, setStatusValue] = useState<OrderStatus>("PENDING");
  const [savingStatus, setSavingStatus] = useState(false);

  // Delivery assignment
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [driversLoading, setDriversLoading] = useState(false);
  const [assignDriverId, setAssignDriverId] = useState("");
  const [deliveryStatus, setDeliveryStatus] = useState<DeliveryStatus>("ASSIGNED");
  const [deliveryNote, setDeliveryNote] = useState("");
  const [savingDelivery, setSavingDelivery] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  useEffect(() => {
    if (!viewOpen) return;
    setDriversLoading(true);
    fetch("/api/drivers")
      .then((res) => res.json())
      .then((json) => setDrivers(json.data ?? []))
      .catch((err) => console.error("Failed to load drivers", err))
      .finally(() => setDriversLoading(false));
  }, [viewOpen]);

  useEffect(() => {
    if (!viewingOrder) return;
    setAssignDriverId(viewingOrder.driverId ? String(viewingOrder.driverId) : "");
    setDeliveryStatus(viewingOrder.deliveryStatus ?? "UNASSIGNED");
    setDeliveryNote(viewingOrder.deliveryNote ?? "");
  }, [viewingOrder]);

  const refreshOrders = async () => {
    const res = await fetch("/api/orders");
    if (!res.ok) return;
    const json = await res.json();
    const fresh: Order[] = json.data ?? [];
    setOrders(fresh);
    setViewingOrder((current) =>
      current ? fresh.find((order) => order.id === current.id) ?? current : current,
    );
  };

  const handleView = (order: Order) => {
    setViewingOrder(order);
    setViewOpen(true);
  };

  const handleEditStatus = (order: Order) => {
    setStatusTarget(order);
    setStatusValue(order.status);
    setStatusOpen(true);
  };

  const confirmStatusChange = async () => {
    if (!statusTarget) return;
    setSavingStatus(true);
    try {
      const res = await fetch(`/api/orders/${statusTarget.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: statusValue }),
      });
      if (!res.ok) throw new Error("Failed to update status");

      setOrders((prev) =>
        prev.map((o) => (o.id === statusTarget.id ? { ...o, status: statusValue } : o)),
      );
      setStatusOpen(false);
      setStatusTarget(null);
      toast.success("Order status updated");
    } catch (error) {
      console.error("Update status error:", error);
      toast.error("Failed to update order status");
    } finally {
      setSavingStatus(false);
    }
  };

  const patchDelivery = async (payload: Record<string, unknown>, successMessage: string) => {
    if (!viewingOrder) return;
    setSavingDelivery(true);
    try {
      const res = await fetch(`/api/orders/${viewingOrder.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to update delivery");

      await refreshOrders();
      toast.success(successMessage);
    } catch (error: any) {
      console.error("Delivery update error:", error);
      toast.error(error.message || "Failed to update delivery");
    } finally {
      setSavingDelivery(false);
    }
  };

  const handleAssignDriver = () =>
    patchDelivery(
      { driverId: assignDriverId ? Number(assignDriverId) : null },
      assignDriverId ? "Driver assigned" : "Driver unassigned",
    );

  const handleUpdateDelivery = () =>
    patchDelivery(
      { deliveryStatus, deliveryNote },
      "Delivery updated",
    );

  const handleDeleteClick = (order: Order) => {
    setDeleteTarget(order);
    setDeleteError(null);
    setDeleteOpen(true);
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/orders/${deleteTarget.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }

      setOrders((prev) => prev.filter((o) => o.id !== deleteTarget.id));
      setDeleteOpen(false);
      setDeleteTarget(null);
    } catch (err: any) {
      console.error("Delete error:", err);
      setDeleteError(err.message || "Failed to delete order.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className={embedded ? "space-y-4" : "p-6 space-y-4"}>
      {!embedded && (
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Orders</h1>
        </div>
      )}

      <DataTable
        columns={columns(handleView, handleEditStatus, handleDeleteClick)}
        data={orders}
        filterBy="fullName"
      />

      {/* View Details */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-h-[92vh] max-w-2xl space-y-4 overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order #{viewingOrder?.id}</DialogTitle>
          </DialogHeader>

          {viewingOrder && (
            <div className="space-y-4 text-sm">
              <div>
                <p className="font-medium">{viewingOrder.fullName}</p>
                <p className="text-muted-foreground">{viewingOrder.email}</p>
                <p className="text-muted-foreground">{viewingOrder.phone}</p>
              </div>

              <div>
                <p className="text-muted-foreground">Shipping to</p>
                <p>
                  {viewingOrder.address}, {viewingOrder.city} {viewingOrder.postalCode}
                </p>
              </div>

              <div className="space-y-1">
                <p className="text-muted-foreground">Items</p>
                {(viewingOrder.items || []).map((item) => (
                  <div key={item.id} className="flex justify-between">
                    <span>
                      {item.name} x {item.quantity}
                    </span>
                    <span>Rs. {(item.sellingPrice * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="border-t pt-2 space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>Rs. {viewingOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Shipping</span>
                  <span>Rs. {viewingOrder.shipping.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>Rs. {viewingOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Delivery */}
              <div className="space-y-3 rounded-lg border border-fuchsia-100 p-3 dark:border-fuchsia-900/40">
                <div className="flex items-center justify-between">
                  <p className="font-semibold">Delivery</p>
                  <span className="rounded-full bg-fuchsia-50 px-2 py-0.5 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300">
                    {DELIVERY_LABELS[viewingOrder.deliveryStatus ?? "UNASSIGNED"]}
                  </span>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="assign-driver">Assigned driver</Label>
                  <div className="flex gap-2">
                    <select
                      id="assign-driver"
                      value={assignDriverId}
                      onChange={(e) => setAssignDriverId(e.target.value)}
                      className="w-full rounded border bg-background p-2"
                      disabled={driversLoading || savingDelivery}
                    >
                      <option value="">No driver</option>
                      {drivers
                        .filter((driver) => driver.status === "ACTIVE")
                        .map((driver) => (
                          <option key={driver.id} value={driver.id}>
                            {driver.name} ({driver.username})
                            {driver.isAvailable ? "" : " - busy"}
                          </option>
                        ))}
                    </select>
                    <Button
                      type="button"
                      onClick={handleAssignDriver}
                      disabled={savingDelivery}
                    >
                      {savingDelivery ? "Saving..." : "Assign"}
                    </Button>
                  </div>
                </div>

                {viewingOrder.driver && (
                  <div className="rounded-md bg-fuchsia-50/60 p-2 text-xs dark:bg-fuchsia-950/20">
                    <p className="font-medium">{viewingOrder.driver.name}</p>
                    <p className="text-muted-foreground">
                      {viewingOrder.driver.phone || "No phone"} ·{" "}
                      {viewingOrder.driver.vehicleType || "Vehicle"} ·{" "}
                      {viewingOrder.driver.vehicleNumber || "No plate"}
                    </p>
                  </div>
                )}

                <div className="space-y-1.5">
                  <Label htmlFor="delivery-status">Update progress</Label>
                  <select
                    id="delivery-status"
                    value={deliveryStatus}
                    onChange={(e) => setDeliveryStatus(e.target.value as DeliveryStatus)}
                    className="w-full rounded border bg-background p-2"
                    disabled={savingDelivery}
                  >
                    {DELIVERY_OPTIONS.map((status) => (
                      <option key={status} value={status}>
                        {DELIVERY_LABELS[status]}
                      </option>
                    ))}
                  </select>
                  <Input
                    value={deliveryNote}
                    onChange={(e) => setDeliveryNote(e.target.value)}
                    placeholder="Note for the customer (optional)"
                    disabled={savingDelivery}
                  />
                  <Button
                    type="button"
                    onClick={handleUpdateDelivery}
                    disabled={savingDelivery}
                  >
                    {savingDelivery ? "Saving..." : "Save delivery update"}
                  </Button>
                </div>

                {(viewingOrder.trackingEvents?.length ?? 0) > 0 && (
                  <div className="space-y-2 border-t pt-2">
                    <p className="text-xs font-medium text-muted-foreground">
                      Recent tracking events
                    </p>
                    {viewingOrder.trackingEvents!.map((event) => (
                      <div key={event.id} className="text-xs">
                        <span className="font-medium">{event.title}</span>
                        <span className="text-muted-foreground">
                          {" "}
                          · {new Date(event.createdAt).toLocaleString()}
                        </span>
                        {event.message && (
                          <p className="text-muted-foreground">{event.message}</p>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status */}
      <Dialog open={statusOpen} onOpenChange={setStatusOpen}>
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>Update Order Status</DialogTitle>
          </DialogHeader>

          <select
            value={statusValue}
            onChange={(e) => setStatusValue(e.target.value as OrderStatus)}
            className="w-full rounded border bg-background p-2"
          >
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              variant="outline"
              onClick={() => setStatusOpen(false)}
              disabled={savingStatus}
            >
              Cancel
            </Button>
            <Button onClick={confirmStatusChange} disabled={savingStatus}>
              {savingStatus ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={`order #${deleteTarget?.id}`}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
