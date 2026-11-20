"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import { Input } from "@online-store/ui/input";
import { Label } from "@online-store/ui/label";
import { toast } from "sonner";
import { CarFront, IdCard, LockKeyhole, Phone } from "lucide-react";
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
      <Card className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
        <div className="flex items-center gap-4">
          <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-lg font-bold text-white shadow-md shadow-fuchsia-200 dark:shadow-fuchsia-900/40">
            {driver.name.charAt(0).toUpperCase()}
          </span>
          <div>
            <p className="text-lg font-semibold">{driver.name}</p>
            <p className="text-sm text-muted-foreground">
              @{driver.username} · {driver.email || "No email added"}
            </p>
          </div>
        </div>
        <AvailabilityToggle available={driver.isAvailable && driver.status === "ACTIVE"} />
      </Card>

      <div className="grid items-start gap-5 lg:grid-cols-2">
        <Card className="space-y-4 rounded-2xl border-fuchsia-100/70 p-5 dark:border-fuchsia-900/30">
          <p className="flex items-center gap-2 font-semibold">
            <CarFront className="h-4 w-4 text-fuchsia-600" /> Rider details
          </p>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Vehicle</dt>
              <dd className="text-right font-medium">{driver.vehicleType || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Plate number</dt>
              <dd className="text-right font-medium">{driver.vehicleNumber || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Licence</dt>
              <dd className="text-right font-medium">{driver.licenseNumber || "—"}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Account</dt>
              <dd className="text-right font-medium">
                {driver.status === "ACTIVE" ? "Active" : "Blocked"}
              </dd>
            </div>
          </dl>
          <p className="text-xs text-muted-foreground">
            Vehicle and account details are managed by the admin.
          </p>
        </Card>

        <form onSubmit={savePhone} className="space-y-4 rounded-2xl border border-fuchsia-100/70 bg-card p-5 dark:border-fuchsia-900/30">
          <p className="flex items-center gap-2 font-semibold">
            <Phone className="h-4 w-4 text-fuchsia-600" /> Contact
          </p>
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

      <form
        onSubmit={changePassword}
        className="space-y-4 rounded-2xl border border-fuchsia-100/70 bg-card p-5 dark:border-fuchsia-900/30"
      >
        <div>
          <p className="flex items-center gap-2 font-semibold">
            <LockKeyhole className="h-4 w-4 text-fuchsia-600" /> Change password
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
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

      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <IdCard className="h-4 w-4" /> Keep your details up to date so customers can reach you.
      </p>
    </div>
  );
}
