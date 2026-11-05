"use client";

import { useMemo, useState } from "react";
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
import { Plus, Trash2 } from "lucide-react";
import type {
  Quotation,
  QuotationProductOption,
  QuotationVendorOption,
} from "@/lib/types";

type RequestLine = {
  key: string;
  productId: number;
  productVariantId: number | null;
  name: string;
  variantLabel: string | null;
  quantity: number;
  requestedUnitPrice: string;
};

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vendors: QuotationVendorOption[];
  products: QuotationProductOption[];
  onCreated: (quotation: Quotation) => void;
};

export default function CreateQuotationDialog({
  open,
  onOpenChange,
  vendors,
  products,
  onCreated,
}: Props) {
  const [vendorId, setVendorId] = useState("");
  const [lines, setLines] = useState<RequestLine[]>([]);
  const [draftProductId, setDraftProductId] = useState("");
  const [draftVariantId, setDraftVariantId] = useState("");
  const [draftQuantity, setDraftQuantity] = useState("1");
  const [draftPrice, setDraftPrice] = useState("");
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const vendorProducts = useMemo(
    () => products.filter((product) => String(product.vendorId) === vendorId),
    [products, vendorId],
  );

  const draftProduct = vendorProducts.find(
    (product) => String(product.id) === draftProductId,
  );

  const reset = () => {
    setVendorId("");
    setLines([]);
    setDraftProductId("");
    setDraftVariantId("");
    setDraftQuantity("1");
    setDraftPrice("");
    setNote("");
    setError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next && saving) return;
    if (!next) reset();
    onOpenChange(next);
  };

  const addLine = () => {
    setError(null);
    const product = draftProduct;
    if (!product) {
      setError("Choose a product to add.");
      return;
    }

    const quantity = Number(draftQuantity);
    if (!Number.isInteger(quantity) || quantity <= 0) {
      setError("Quantity must be a whole number of at least 1.");
      return;
    }

    let variantId: number | null = null;
    let variantLabel: string | null = null;

    if (product.variants.length > 0) {
      variantId = Number(draftVariantId);
      const variant = product.variants.find((item) => item.id === variantId);
      if (!variant) {
        setError("Choose a variant for this product.");
        return;
      }
      variantLabel = variant.sku || `Variant #${variant.id}`;
    }

    const duplicate = lines.some(
      (line) =>
        line.productId === product.id && line.productVariantId === variantId,
    );
    if (duplicate) {
      setError("That product/variant is already in the request.");
      return;
    }

    setLines((prev) => [
      ...prev,
      {
        key: `${product.id}-${variantId ?? "base"}-${Date.now()}`,
        productId: product.id,
        productVariantId: variantId,
        name: product.name,
        variantLabel,
        quantity,
        requestedUnitPrice: draftPrice,
      },
    ]);

    setDraftProductId("");
    setDraftVariantId("");
    setDraftQuantity("1");
    setDraftPrice("");
  };

  const updateLine = (key: string, patch: Partial<RequestLine>) => {
    setLines((prev) =>
      prev.map((line) => (line.key === key ? { ...line, ...patch } : line)),
    );
  };

  const submit = async () => {
    setError(null);
    const vendor = Number(vendorId);
    if (!vendor) {
      setError("Choose the vendor you want a quotation from.");
      return;
    }
    if (lines.length === 0) {
      setError("Add at least one product to the request.");
      return;
    }
    for (const line of lines) {
      if (!Number.isInteger(line.quantity) || line.quantity <= 0) {
        setError("Every line needs a quantity of at least 1.");
        return;
      }
    }

    setSaving(true);
    try {
      const res = await fetch("/api/quotations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vendorId: vendor,
          requestNote: note,
          items: lines.map((line) => ({
            productId: line.productId,
            productVariantId: line.productVariantId,
            quantity: line.quantity,
            requestedUnitPrice: line.requestedUnitPrice,
          })),
        }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to send request");

      onCreated(body.data as Quotation);
      reset();
      onOpenChange(false);
    } catch (err: any) {
      setError(err.message || "Failed to send the quotation request.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>New stock quotation request</DialogTitle>
          <DialogDescription>
            Ask a vendor to quote a price for stock. They can accept the request
            with a price, or reject it.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 text-sm">
          <div className="space-y-1.5">
            <Label htmlFor="quotation-vendor">Vendor</Label>
            <select
              id="quotation-vendor"
              value={vendorId}
              onChange={(event) => {
                setVendorId(event.target.value);
                setLines([]);
                setDraftProductId("");
                setDraftVariantId("");
              }}
              className="w-full rounded border bg-background p-2"
              disabled={saving}
            >
              <option value="">Select a vendor</option>
              {vendors
                .filter((vendor) => vendor.status === "ACTIVE")
                .map((vendor) => (
                  <option key={vendor.id} value={vendor.id}>
                    {vendor.name}
                    {vendor.email ? ` (${vendor.email})` : ""}
                  </option>
                ))}
            </select>
          </div>

          {vendorId && (
            <div className="space-y-2 rounded-lg border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                Add products
              </p>
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={draftProductId}
                  onChange={(event) => {
                    setDraftProductId(event.target.value);
                    setDraftVariantId("");
                  }}
                  className="w-full rounded border bg-background p-2"
                  disabled={saving}
                >
                  <option value="">Select product</option>
                  {vendorProducts.map((product) => (
                    <option key={product.id} value={product.id}>
                      {product.name}
                    </option>
                  ))}
                </select>

                {draftProduct && draftProduct.variants.length > 0 && (
                  <select
                    value={draftVariantId}
                    onChange={(event) => setDraftVariantId(event.target.value)}
                    className="w-full rounded border bg-background p-2"
                    disabled={saving}
                  >
                    <option value="">Select variant</option>
                    {draftProduct.variants.map((variant) => (
                      <option key={variant.id} value={variant.id}>
                        {variant.sku || `Variant #${variant.id}`} · stock{" "}
                        {variant.stock}
                      </option>
                    ))}
                  </select>
                )}

                <div className="flex gap-2">
                  <Input
                    type="number"
                    min={1}
                    value={draftQuantity}
                    onChange={(event) => setDraftQuantity(event.target.value)}
                    placeholder="Qty"
                    disabled={saving}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={draftPrice}
                    onChange={(event) => setDraftPrice(event.target.value)}
                    placeholder="Target price (optional)"
                    disabled={saving}
                  />
                </div>

                <Button type="button" variant="outline" onClick={addLine} disabled={saving}>
                  <Plus className="mr-2 h-4 w-4" />
                  Add product
                </Button>
              </div>
            </div>
          )}

          {lines.length > 0 && (
            <div className="space-y-2">
              <p className="text-xs font-medium text-muted-foreground">
                Requested items
              </p>
              {lines.map((line) => (
                <div
                  key={line.key}
                  className="flex flex-wrap items-center gap-2 rounded-md border p-2"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{line.name}</p>
                    {line.variantLabel && (
                      <p className="text-xs text-muted-foreground">{line.variantLabel}</p>
                    )}
                  </div>
                  <Input
                    type="number"
                    min={1}
                    value={line.quantity}
                    onChange={(event) =>
                      updateLine(line.key, {
                        quantity: Number(event.target.value),
                      })
                    }
                    className="w-20"
                    disabled={saving}
                  />
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={line.requestedUnitPrice}
                    onChange={(event) =>
                      updateLine(line.key, {
                        requestedUnitPrice: event.target.value,
                      })
                    }
                    placeholder="Target price"
                    className="w-32"
                    disabled={saving}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setLines((prev) => prev.filter((item) => item.key !== line.key))
                    }
                    disabled={saving}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="quotation-note">Note for the vendor (optional)</Label>
            <Textarea
              id="quotation-note"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder="Delivery instructions, quality requirement, preferred pickup time…"
              rows={3}
              disabled={saving}
            />
          </div>

          {error && (
            <p className="rounded-md bg-red-50 p-2 text-xs text-red-600 dark:bg-red-950/40 dark:text-red-300">
              {error}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => handleOpenChange(false)}
            disabled={saving}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={saving}>
            {saving ? "Sending…" : "Send request"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
