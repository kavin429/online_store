"use client";

import { useEffect, useState } from "react";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { toast } from "sonner";

export type DriverCredentials = { username: string; password: string };

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (driver: any, credentials: DriverCredentials) => void;
};

const EMPTY = {
  name: "",
  phone: "",
  email: "",
  vehicleType: "",
  vehicleNumber: "",
  licenseNumber: "",
  note: "",
};

export default function AddDriverDialog({ open, onOpenChange, onCreated }: Props) {
  const [values, setValues] = useState({ ...EMPTY });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (open) setValues({ ...EMPTY });
  }, [open]);

  const set = (field: keyof typeof EMPTY) => (event: React.ChangeEvent<HTMLInputElement>) =>
    setValues((current) => ({ ...current, [field]: event.target.value }));

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!values.name.trim()) {
      toast.error("Please enter the driver's name");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/drivers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to add driver");

      onCreated(body.data, body.credentials);
      onOpenChange(false);
      toast.success("Driver added. Share the generated login.");
    } catch (error: any) {
      toast.error(error.message || "Failed to add driver");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-lg overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Delivery Driver</DialogTitle>
        </DialogHeader>

        <form onSubmit={submit} className="space-y-4">
          <p className="rounded-md bg-fuchsia-50 px-3 py-2 text-xs text-fuchsia-800 dark:bg-fuchsia-950/30 dark:text-fuchsia-200">
            A username and password will be generated automatically. You can copy
            them and give them to the driver.
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="driver-name">Driver name *</Label>
            <Input
              id="driver-name"
              value={values.name}
              onChange={set("name")}
              placeholder="e.g. Kasun Perera"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="driver-phone">Phone</Label>
              <Input
                id="driver-phone"
                value={values.phone}
                onChange={set("phone")}
                placeholder="07X XXX XXXX"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="driver-email">Email (optional)</Label>
              <Input
                id="driver-email"
                type="email"
                value={values.email}
                onChange={set("email")}
                placeholder="driver@example.com"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-type">Vehicle type</Label>
              <Input
                id="vehicle-type"
                value={values.vehicleType}
                onChange={set("vehicleType")}
                placeholder="Bike / Van / Lorry"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="vehicle-number">Vehicle number</Label>
              <Input
                id="vehicle-number"
                value={values.vehicleNumber}
                onChange={set("vehicleNumber")}
                placeholder="WP-AB-1234"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="license-number">License number</Label>
            <Input
              id="license-number"
              value={values.licenseNumber}
              onChange={set("licenseNumber")}
              placeholder="Driving licence number"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="driver-note">Note</Label>
            <Input
              id="driver-note"
              value={values.note}
              onChange={set("note")}
              placeholder="Any internal note about this driver"
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Creating..." : "Create driver"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
