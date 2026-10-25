"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, Order } from "./column";
import ManageStatusDialog, { StatusOption } from "@/components/comman/manage-status-dialog";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";

const orderStatusOptions: StatusOption[] = [
  { value: "PENDING", label: "Pending", buttonVariant: "outline" },
  { value: "CONFIRMED", label: "Confirm", buttonVariant: "shoesecondary" },
  { value: "SHIPPED", label: "Mark Shipped", buttonVariant: "shoesecondary" },
  { value: "DELIVERED", label: "Mark Delivered", buttonVariant: "shoesecondary" },
  {
    value: "CANCELLED",
    label: "Cancel Order",
    confirmText: "Are you sure you want to cancel this order? This action cannot be undone.",
    buttonVariant: "destructive",
  },
];

export default function OrderMain({ data }: { data: Order[] }) {
  const [orders, setOrders] = useState<Order[]>(data);

  // View details
  const [viewingOrder, setViewingOrder] = useState<Order | null>(null);
  const [viewOpen, setViewOpen] = useState(false);

  // Change status
  const [manageTarget, setManageTarget] = useState<Order | null>(null);
  const [manageOpen, setManageOpen] = useState(false);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Order | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const handleView = (order: Order) => {
    setViewingOrder(order);
    setViewOpen(true);
  };

  const handleEditStatus = (order: Order) => {
    setManageTarget(order);
    setManageOpen(true);
  };

  const handleStatusChanged = (updated: Order) => {
    setOrders((prev) =>
      prev.map((o) =>
        o.id === updated.id ? { ...o, status: updated.status } : o,
      ),
    );
  };

  const handleOrderStatusChange = async (
    order: Order,
    status: string,
  ) => {
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update status");
    }
    const json = await res.json();
    return json.data as Order;
  };

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
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
      </div>

      <DataTable
        columns={columns(handleView, handleEditStatus, handleDeleteClick)}
        data={orders}
        filterBy="fullName"
      />

      {/* View Details */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-lg space-y-4">
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
                      {item.name} × {item.quantity}
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Change Status */}
      <ManageStatusDialog
        entity={manageTarget}
        open={manageOpen}
        onOpenChange={setManageOpen}
        onStatusChange={handleOrderStatusChange}
        onUpdated={handleStatusChanged}
        entityLabel="order"
        statusOptions={orderStatusOptions}
      />

      {/* Delete */}
      <ConfirmDeleteDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={deleteTarget ? `order #${deleteTarget.id}` : undefined}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}