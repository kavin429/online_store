"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { GEO } from "./constants";
import type { AddressView } from "./types";
import { Field, PickList } from "./ui";

const EMPTY: AddressView = {
  id: 0,
  label: "",
  line: "",
  country: "",
  province: "",
  district: "",
  city: "",
  postal: "",
  isDefault: false,
};

export function AddressDialog({
  address,
  countries,
  onClose,
  onSaved,
}: {
  address: AddressView | null;
  countries: string[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const [form, setForm] = useState<AddressView | null>(address);
  const [busy, setBusy] = useState(false);

  useEffect(() => setForm(address), [address]);

  if (!form) return null;

  const countryOptions = Array.from(
    new Set([...countries, ...(form.country ? [form.country] : [])])
  );
  const provinces = Object.keys(GEO[form.country] ?? {});
  const districts = Object.keys(GEO[form.country]?.[form.province] ?? {});
  const cities = GEO[form.country]?.[form.province]?.[form.district] ?? [];

  const set = (patch: Partial<AddressView>) => setForm({ ...form, ...patch });

  const submit = async () => {
    if (!form.label.trim() || !form.line.trim()) {
      toast.error("Enter a label and street address.");
      return;
    }
    if (!form.country || !form.province || !form.district || !form.city) {
      toast.error("Please choose country, province, district and city.");
      return;
    }

    setBusy(true);
    try {
      const isNew = !form.id;
      const res = await fetch(
        isNew ? "/api/profile/addresses" : `/api/profile/addresses/${form.id}`,
        {
          method: isNew ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            label: form.label.trim(),
            line: form.line.trim(),
            country: form.country,
            province: form.province,
            district: form.district,
            city: form.city,
            postal: form.postal.trim(),
            isDefault: form.isDefault,
          }),
        }
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save this address.");

      toast.success(isNew ? "Address added." : "Address updated.");
      onSaved();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save this address.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={!!address} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>{form.id ? "Edit address" : "Add address"}</DialogTitle>
          <DialogDescription>Pick your location from the dropdowns.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Label (Home, Office...)">
            <Input value={form.label} onChange={(e) => set({ label: e.target.value })} />
          </Field>
          <Field label="Postal code">
            <Input value={form.postal} onChange={(e) => set({ postal: e.target.value })} />
          </Field>

          <div className="sm:col-span-2">
            <Field label="Street address">
              <Input value={form.line} onChange={(e) => set({ line: e.target.value })} />
            </Field>
          </div>

          <Field label="Country">
            <PickList
              value={form.country}
              options={countryOptions}
              placeholder="Select country"
              onChange={(value) => set({ country: value, province: "", district: "", city: "" })}
            />
          </Field>
          <Field label="Province">
            <PickList
              value={form.province}
              options={provinces}
              placeholder="Select province"
              disabled={!form.country}
              onChange={(value) => set({ province: value, district: "", city: "" })}
            />
          </Field>
          <Field label="District">
            <PickList
              value={form.district}
              options={districts}
              placeholder="Select district"
              disabled={!form.province}
              onChange={(value) => set({ district: value, city: "" })}
            />
          </Field>
          <Field label="City">
            <PickList
              value={form.city}
              options={cities}
              placeholder="Select city"
              disabled={!form.district}
              onChange={(value) => set({ city: value })}
            />
          </Field>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            className="h-4 w-4 accent-fuchsia-600"
            checked={form.isDefault}
            onChange={(e) => set({ isDefault: e.target.checked })}
          />
          Make this my default address
        </label>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button onClick={submit} disabled={busy} className="w-full sm:w-auto">
            {busy ? "Saving..." : "Save address"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export { EMPTY as EMPTY_ADDRESS };
