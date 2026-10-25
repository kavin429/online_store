"use client";

import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { Textarea } from "@online-store/ui/textarea";
import type {
  Promo,
  PromoDiscountType,
  PromoStatus,
  PromoTargetType,
} from "@/lib/types";

const DISCOUNT_TYPE_OPTIONS: PromoDiscountType[] = ["PERCENTAGE", "FIXED"];

const TARGET_TYPE_OPTIONS: { value: PromoTargetType; label: string }[] = [
  { value: "ALL", label: "All Customers" },
  { value: "NEW_CUSTOMER", label: "New Customers (no prior orders)" },
  { value: "OLD_CUSTOMER", label: "Existing Customers (has past orders)" },
  { value: "SELECTED_CUSTOMER", label: "Selected Customers (by criteria)" },
];

const STATUS_OPTIONS: PromoStatus[] = ["ACTIVE", "INACTIVE", "EXPIRED"];

export type PromoFormState = {
  code: string;
  name: string;
  description: string;
  discountType: PromoDiscountType;
  discountValue: string;
  maxDiscount: string;
  minOrderAmount: string;
  targetType: PromoTargetType;
  minOrderCount: string;
  minTotalSpent: string;
  maxTotalSpent: string;
  usageLimit: string;
  usageLimitPerUser: string;
  startsAt: string;
  expiresAt: string;
  status: PromoStatus;
};

const emptyForm: PromoFormState = {
  code: "",
  name: "",
  description: "",
  discountType: "PERCENTAGE",
  discountValue: "",
  maxDiscount: "",
  minOrderAmount: "",
  targetType: "ALL",
  minOrderCount: "",
  minTotalSpent: "",
  maxTotalSpent: "",
  usageLimit: "",
  usageLimitPerUser: "1",
  startsAt: "",
  expiresAt: "",
  status: "ACTIVE",
};

function toDateInputValue(value?: string | null) {
  return value ? new Date(value).toISOString().slice(0, 10) : "";
}

const toFormState = (promo: Promo): PromoFormState => ({
  code: promo.code,
  name: promo.name,
  description: promo.description ?? "",
  discountType: promo.discountType,
  discountValue: String(promo.discountValue),
  maxDiscount: promo.maxDiscount != null ? String(promo.maxDiscount) : "",
  minOrderAmount: promo.minOrderAmount != null ? String(promo.minOrderAmount) : "",
  targetType: promo.targetType,
  minOrderCount: promo.minOrderCount != null ? String(promo.minOrderCount) : "",
  minTotalSpent: promo.minTotalSpent != null ? String(promo.minTotalSpent) : "",
  maxTotalSpent: promo.maxTotalSpent != null ? String(promo.maxTotalSpent) : "",
  usageLimit: promo.usageLimit != null ? String(promo.usageLimit) : "",
  usageLimitPerUser: String(promo.usageLimitPerUser),
  startsAt: toDateInputValue(promo.startsAt),
  expiresAt: toDateInputValue(promo.expiresAt),
  status: promo.status,
});

const toNullableNumber = (value: string) => (value.trim() === "" ? null : Number(value));

export const buildPromoPayload = (form: PromoFormState) => ({
  code: form.code.trim().toUpperCase(),
  name: form.name.trim(),
  description: form.description.trim() || null,
  discountType: form.discountType,
  discountValue: Number(form.discountValue),
  maxDiscount: form.discountType === "PERCENTAGE" ? toNullableNumber(form.maxDiscount) : null,
  minOrderAmount: toNullableNumber(form.minOrderAmount),
  targetType: form.targetType,
  minOrderCount:
    form.targetType === "SELECTED_CUSTOMER" ? toNullableNumber(form.minOrderCount) : null,
  minTotalSpent:
    form.targetType === "SELECTED_CUSTOMER" ? toNullableNumber(form.minTotalSpent) : null,
  maxTotalSpent:
    form.targetType === "SELECTED_CUSTOMER" ? toNullableNumber(form.maxTotalSpent) : null,
  usageLimit: toNullableNumber(form.usageLimit),
  usageLimitPerUser: Number(form.usageLimitPerUser),
  startsAt: form.startsAt || null,
  expiresAt: form.expiresAt || null,
  status: form.status,
});

export type PromoPayload = ReturnType<typeof buildPromoPayload>;

function validateForm(form: PromoFormState) {
  const code = form.code.trim().toUpperCase();
  const discountValue = Number(form.discountValue);

  if (!/^[A-Z0-9_-]{3,32}$/.test(code)) {
    return "Code must be 3-32 characters using letters, numbers, _ or -.";
  }
  if (!form.name.trim()) return "Name is required.";
  if (!Number.isFinite(discountValue) || discountValue <= 0) {
    return "Discount value must be greater than zero.";
  }
  if (form.discountType === "PERCENTAGE" && discountValue > 100) {
    return "Percentage discount cannot be greater than 100.";
  }
  if (form.maxDiscount && (!Number.isFinite(Number(form.maxDiscount)) || Number(form.maxDiscount) <= 0)) {
    return "Maximum discount must be greater than zero.";
  }
  if (form.targetType === "SELECTED_CUSTOMER") {
    if (!form.minOrderCount && !form.minTotalSpent && !form.maxTotalSpent) {
      return "Provide at least one targeting criterion.";
    }
    if (
      form.minTotalSpent &&
      form.maxTotalSpent &&
      Number(form.minTotalSpent) > Number(form.maxTotalSpent)
    ) {
      return "Minimum total spent cannot be greater than maximum total spent.";
    }
  }
  if (form.usageLimit && (!Number.isInteger(Number(form.usageLimit)) || Number(form.usageLimit) < 1)) {
    return "Usage limit must be a positive whole number.";
  }
  if (!Number.isInteger(Number(form.usageLimitPerUser)) || Number(form.usageLimitPerUser) < 1) {
    return "Per-customer limit must be a positive whole number.";
  }
  if (form.startsAt && form.expiresAt) {
    const startsAt = new Date(`${form.startsAt}T00:00:00.000Z`).getTime();
    const expiresAt = new Date(`${form.expiresAt}T00:00:00.000Z`).getTime();
    if (expiresAt <= startsAt) return "Expiry date must be after the start date.";
  }
  return null;
}

type PromoFormDialogProps = {
  open: boolean;
  mode: "create" | "edit";
  promo?: Promo | null;
  onOpenChange: (open: boolean) => void;
  onSubmit: (payload: PromoPayload) => Promise<void> | void;
  saving?: boolean;
  error?: string | null;
};

export default function PromoFormDialog({
  open,
  mode,
  promo,
  onOpenChange,
  onSubmit,
  saving = false,
  error = null,
}: PromoFormDialogProps) {
  const [form, setForm] = useState<PromoFormState>(emptyForm);
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setForm(promo ? toFormState(promo) : emptyForm);
      setLocalError(null);
    }
  }, [open, promo]);

  const updateField = <Key extends keyof PromoFormState>(
    key: Key,
    value: PromoFormState[Key],
  ) => {
    setForm((current) => ({ ...current, [key]: value }));
    setLocalError(null);
  };

  const handleSubmit = async () => {
    const validationError = validateForm(form);
    if (validationError) {
      setLocalError(validationError);
      return;
    }
    setLocalError(null);
    await onSubmit(buildPromoPayload(form));
  };

  const displayError = localError || error;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[85vh] max-w-lg space-y-4 overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "edit" ? "Edit Promo" : "New Promo"}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Promo Code</Label>
              <Input
                value={form.code}
                onChange={(event) => updateField("code", event.target.value)}
                placeholder="WELCOME10"
                maxLength={32}
              />
            </div>
            <div className="space-y-1">
              <Label>Name</Label>
              <Input
                value={form.name}
                onChange={(event) => updateField("name", event.target.value)}
                placeholder="Welcome Discount"
                maxLength={120}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Description</Label>
            <Textarea
              value={form.description}
              onChange={(event) => updateField("description", event.target.value)}
              rows={2}
              maxLength={500}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label>Discount Type</Label>
              <select
                value={form.discountType}
                onChange={(event) =>
                  updateField("discountType", event.target.value as PromoDiscountType)
                }
                className="w-full rounded border p-2 text-sm"
              >
                {DISCOUNT_TYPE_OPTIONS.map((type) => (
                  <option key={type} value={type}>
                    {type === "PERCENTAGE" ? "Percentage (%)" : "Fixed (Rs.)"}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <Label>Value</Label>
              <Input
                type="number"
                min="0.01"
                step="0.01"
                value={form.discountValue}
                onChange={(event) => updateField("discountValue", event.target.value)}
              />
            </div>
            {form.discountType === "PERCENTAGE" && (
              <div className="space-y-1">
                <Label>Max Discount</Label>
                <Input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={form.maxDiscount}
                  onChange={(event) => updateField("maxDiscount", event.target.value)}
                  placeholder="Optional"
                />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <Label>Minimum Order Amount</Label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={form.minOrderAmount}
              onChange={(event) => updateField("minOrderAmount", event.target.value)}
              placeholder="Optional"
            />
          </div>

          <div className="space-y-1">
            <Label>Target Audience</Label>
            <select
              value={form.targetType}
              onChange={(event) => updateField("targetType", event.target.value as PromoTargetType)}
              className="w-full rounded border p-2 text-sm"
            >
              {TARGET_TYPE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-muted-foreground">
              Matching customers are assigned automatically and notified when they first match.
            </p>
          </div>

          {form.targetType === "SELECTED_CUSTOMER" && (
            <div className="grid grid-cols-3 gap-3 rounded-md border bg-muted/30 p-3">
              <div className="space-y-1">
                <Label className="text-xs">Min Orders</Label>
                <Input
                  type="number"
                  min="0"
                  step="1"
                  value={form.minOrderCount}
                  onChange={(event) => updateField("minOrderCount", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Min Spent</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.minTotalSpent}
                  onChange={(event) => updateField("minTotalSpent", event.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Max Spent</Label>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.maxTotalSpent}
                  onChange={(event) => updateField("maxTotalSpent", event.target.value)}
                />
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Total Usage Limit</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.usageLimit}
                onChange={(event) => updateField("usageLimit", event.target.value)}
                placeholder="Unlimited if empty"
              />
            </div>
            <div className="space-y-1">
              <Label>Limit Per Customer</Label>
              <Input
                type="number"
                min="1"
                step="1"
                value={form.usageLimitPerUser}
                onChange={(event) => updateField("usageLimitPerUser", event.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Starts</Label>
              <Input
                type="date"
                value={form.startsAt}
                onChange={(event) => updateField("startsAt", event.target.value)}
              />
            </div>
            <div className="space-y-1">
              <Label>Expires</Label>
              <Input
                type="date"
                value={form.expiresAt}
                onChange={(event) => updateField("expiresAt", event.target.value)}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Status</Label>
            <select
              value={form.status}
              onChange={(event) => updateField("status", event.target.value as PromoStatus)}
              className="w-full rounded border p-2 text-sm"
            >
              {STATUS_OPTIONS.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </div>

          {displayError && (
            <p className="text-sm text-destructive" role="alert">
              {displayError}
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? "Saving..." : mode === "edit" ? "Save Changes" : "Create Promo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
