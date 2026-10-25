"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { columns, InventoryItem } from "./column";
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
import { AlertTriangle } from "lucide-react";

export default function InventoryMain({
  data,
  lowStockCount,
}: {
  data: InventoryItem[];
  lowStockCount: number;
}) {
  const [items, setItems] = useState<InventoryItem[]>(data);

  const [restockItem, setRestockItem] = useState<InventoryItem | null>(null);
  const [restockOpen, setRestockOpen] = useState(false);
  const [restockQty, setRestockQty] = useState(1);
  const [restockNote, setRestockNote] = useState("");
  const [saving, setSaving] = useState(false);

  const handleRestock = (item: InventoryItem) => {
    setRestockItem(item);
    setRestockQty(1);
    setRestockNote("");
    setRestockOpen(true);
  };

  const confirmRestock = async () => {
    if (!restockItem || restockQty <= 0) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/inventory/${restockItem.id}/restock`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ quantity: restockQty, note: restockNote }),
      });
      if (!res.ok) throw new Error("Failed to restock");

      setItems((prev) =>
        prev.map((i) =>
          i.id === restockItem.id ? { ...i, stock: i.stock + restockQty } : i
        )
      );
      setRestockOpen(false);
      setRestockItem(null);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Inventory</h1>
          <p className="text-sm text-muted-foreground">
            Stock levels for all product variants
          </p>
        </div>
        {lowStockCount > 0 && (
          <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400 text-sm">
            <AlertTriangle size={16} />
            <span>{lowStockCount} low stock alerts</span>
          </div>
        )}
      </div>

      <DataTable
        columns={columns(handleRestock)}
        data={items}
        filterBy="sku"
      />

      {/* Restock Dialog */}
      <Dialog open={restockOpen} onOpenChange={setRestockOpen}>
        <DialogContent className="max-w-sm space-y-4">
          <DialogHeader>
            <DialogTitle>Restock Variant</DialogTitle>
          </DialogHeader>

          {restockItem && (
            <div className="space-y-3 text-sm">
              <div>
                <p className="font-medium">{restockItem.product.name}</p>
                <p className="text-muted-foreground font-mono text-xs">{restockItem.sku}</p>
                <p className="text-muted-foreground">Current stock: {restockItem.stock}</p>
              </div>

              <div className="space-y-2">
                <Label>Quantity to add</Label>
                <Input
                  type="number"
                  min={1}
                  value={restockQty}
                  onChange={(e) => setRestockQty(Number(e.target.value))}
                />
              </div>

              <div className="space-y-2">
                <Label>Note (optional)</Label>
                <Input
                  value={restockNote}
                  onChange={(e) => setRestockNote(e.target.value)}
                  placeholder="e.g. New batch received"
                />
              </div>
            </div>
          )}

          <DialogFooter className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setRestockOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button onClick={confirmRestock} disabled={saving || restockQty <= 0}>
              {saving ? "Saving..." : "Restock"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}