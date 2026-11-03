"use client";

import { useState } from "react";
import { DataTable } from "@online-store/ui/data-table";
import { Button } from "@online-store/ui/button";
import { Badge } from "@online-store/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@online-store/ui/dialog";
import { Check, Copy, Plus } from "lucide-react";
import { toast } from "sonner";
import { Driver } from "@/lib/types";
import ConfirmDeleteDialog from "@/components/comman/confirm-delete-dialog";
import AddDriverDialog, { DriverCredentials } from "./AddDriverDialog";
import { columns } from "./column";

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy. Please copy it manually.");
    }
  };

  return (
    <div className="flex items-center justify-between gap-3 rounded-md border p-3">
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate font-mono text-sm font-semibold">{value}</p>
      </div>
      <Button type="button" variant="outline" size="sm" onClick={copy}>
        {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
        {copied ? "Copied" : "Copy"}
      </Button>
    </div>
  );
}

export default function DriversMain({ data }: { data: Driver[] }) {
  const [drivers, setDrivers] = useState<Driver[]>(data);

  const [addOpen, setAddOpen] = useState(false);
  const [deletingDriver, setDeletingDriver] = useState<Driver | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const [credentialDriver, setCredentialDriver] = useState<Driver | null>(null);
  const [credentials, setCredentials] = useState<DriverCredentials | null>(null);
  const [resetting, setResetting] = useState(false);

  const onCreated = (driver: Driver, creds: DriverCredentials) => {
    setDrivers((current) => [driver, ...current]);
    setCredentialDriver(driver);
    setCredentials(creds);
  };

  const showCredentials = (driver: Driver) => {
    setCredentialDriver(driver);
    setCredentials(
      driver.plainPassword
        ? { username: driver.username, password: driver.plainPassword }
        : null,
    );
  };

  const toggleBlock = async (driver: Driver) => {
    const status = driver.status === "ACTIVE" ? "BLOCKED" : "ACTIVE";
    try {
      const res = await fetch(`/api/drivers/${driver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to update driver");

      setDrivers((current) =>
        current.map((item) => (item.id === driver.id ? { ...item, ...body.data } : item)),
      );
      toast.success(status === "BLOCKED" ? "Driver blocked" : "Driver activated");
    } catch (error: any) {
      toast.error(error.message || "Failed to update driver");
    }
  };

  const resetPassword = async () => {
    if (!credentialDriver) return;
    setResetting(true);
    try {
      const res = await fetch(`/api/drivers/${credentialDriver.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetPassword: true }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to reset password");

      setCredentialDriver((current) => (current ? { ...current, ...body.data } : current));
      setDrivers((current) =>
        current.map((item) =>
          item.id === credentialDriver.id ? { ...item, ...body.data } : item,
        ),
      );
      setCredentials(body.credentials);
      toast.success("New password generated");
    } catch (error: any) {
      toast.error(error.message || "Failed to reset password");
    } finally {
      setResetting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deletingDriver) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      const res = await fetch(`/api/drivers/${deletingDriver.id}`, {
        method: "DELETE",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Delete failed");

      setDrivers((current) => current.filter((item) => item.id !== deletingDriver.id));
      setDeletingDriver(null);
      toast.success("Driver deleted");
    } catch (error: any) {
      setDeleteError(error.message || "Failed to delete driver");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-4 p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Delivery Drivers</h1>
          <p className="text-sm text-muted-foreground">
            Create riders and share their auto-generated login with the driver app.
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="mr-1 h-4 w-4" /> Add Driver
        </Button>
      </div>

      <DataTable columns={columns(toggleBlock, showCredentials, setDeletingDriver)} data={drivers} filterBy="name" />

      <AddDriverDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        onCreated={onCreated}
      />

      {/* Credentials */}
      <Dialog
        open={!!credentialDriver}
        onOpenChange={(open) => {
          if (!open) {
            setCredentialDriver(null);
            setCredentials(null);
          }
        }}
      >
        <DialogContent className="max-w-md space-y-4">
          <DialogHeader>
            <DialogTitle>Driver login — {credentialDriver?.name}</DialogTitle>
          </DialogHeader>

          <p className="text-sm text-muted-foreground">
            Give these credentials to the driver. They sign in at the driver app
            (usually <span className="font-mono">http://localhost:3003</span>).
          </p>

          <CopyValue
            label="Username"
            value={credentials?.username ?? credentialDriver?.username ?? ""}
          />
          <CopyValue
            label="Password"
            value={credentials?.password ?? credentialDriver?.plainPassword ?? "Not available"}
          />

          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{credentialDriver?.status ?? "ACTIVE"}</Badge>
            <Badge variant="outline">
              {credentialDriver?.deliveriesCount ?? 0} deliveries
            </Badge>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCredentialDriver(null)}>
              Close
            </Button>
            <Button onClick={resetPassword} disabled={resetting}>
              {resetting ? "Generating..." : "Reset password"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deletingDriver}
        onOpenChange={(open) => {
          if (!open) setDeletingDriver(null);
        }}
        onConfirm={confirmDelete}
        itemName={deletingDriver ? `driver ${deletingDriver.name}` : "driver"}
        loading={deleting}
        error={deleteError}
      />
    </div>
  );
}
