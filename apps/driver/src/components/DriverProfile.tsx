"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { toast } from "sonner";
import AvailabilityToggle from "./AvailabilityToggle";

type DriverProfileData = {
  name: string;
  username: string;
  email: string | null;
  phone: string | null;
  vehicleType: string | null;
  vehicleNumber: string | null;
  licenseNumber: string | null;
  isAvailable: boolean;
  status: string;
};

export default function DriverProfile({ driver }: { driver: DriverProfileData }) {
  const router = useRouter();
  const [phone, setPhone] = useState(driver.phone ?? "");
  const [savingPhone, setSavingPhone] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);

  const savePhone = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPhone(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not save phone");
      toast.success("Phone number updated");
      router.refresh();
    } catch (error: any) {
      toast.error(error.message || "Could not save phone");
    } finally {
      setSavingPhone(false);
    }
  };

  const changePassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setSavingPassword(true);
    try {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Could not change password");
      setCurrentPassword("");
      setNewPassword("");
      toast.success("Password changed");
    } catch (error: any) {
      toast.error(error.message || "Could not change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{driver.name}</h1>
          <p className="text-sm text-muted-foreground">
            @{driver.username} · {driver.email || "No email added"}
          </p>
        </div>
        <AvailabilityToggle available={driver.isAvailable && driver.status === "ACTIVE"} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl border p-4 text-sm">
          <p className="mb-2 font-semibold">Rider details</p>
          <dl className="space-y-1.5">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd>{driver.vehicleType || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Plate number</dt>
              <dd>{driver.vehicleNumber || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Licence</dt>
              <dd>{driver.licenseNumber || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Account</dt>
              <dd>{driver.status === "ACTIVE" ? "Active" : "Blocked"}</dd>
            </div>
          </dl>
          <p className="mt-3 text-xs text-muted-foreground">
            Vehicle and account details are managed by the admin.
          </p>
        </div>

        <form onSubmit={savePhone} className="space-y-3 rounded-xl border p-4">
          <p className="font-semibold">Contact</p>
          <div className="space-y-1.5">
            <Label htmlFor="profile-phone">Phone number</Label>
            <Input
              id="profile-phone"
              value={phone}
              onChange={(event) => setPhone(event.target.value)}
              placeholder="07X XXX XXXX"
            />
          </div>
          <Button type="submit" size="sm" disabled={savingPhone}>
            {savingPhone ? "Saving..." : "Save phone"}
          </Button>
        </form>
      </div>

      <form onSubmit={changePassword} className="space-y-3 rounded-xl border p-4">
        <div>
          <p className="font-semibold">Change password</p>
          <p className="text-xs text-muted-foreground">
            Use a password you can remember. The admin can also reset it.
          </p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="current-password">Current password</Label>
            <Input
              id="current-password"
              type="password"
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="new-password">New password</Label>
            <Input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              minLength={6}
              required
            />
          </div>
        </div>
        <Button type="submit" size="sm" disabled={savingPassword}>
          {savingPassword ? "Saving..." : "Update password"}
        </Button>
      </form>
    </div>
  );
}
