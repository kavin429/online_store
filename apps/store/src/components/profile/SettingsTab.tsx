"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Plus, ShieldAlert, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@online-store/ui/select";
import { AddressDialog, EMPTY_ADDRESS } from "./AddressDialog";
import { DIAL_CODES, validatePhoneForCountry } from "./constants";
import { DeleteAccountDialog } from "./DeleteAccountDialog";
import type { AddressView, ProfileData } from "./types";
import { Field, cardCls, h2Cls, mutedCls } from "./ui";

export function SettingsTab({
  data,
  onDeleted,
}: {
  data: ProfileData;
  onDeleted: () => void;
}) {
  const router = useRouter();
  const { user, membership, addresses, countries } = data;

  const [name, setName] = useState(user.name);
  const [dial, setDial] = useState(user.dial);
  const [phone, setPhone] = useState(user.phone);
  const [dob, setDob] = useState(user.dob);
  const [offersEmail, setOffersEmail] = useState(user.offersEmail);
  const [offersSms, setOffersSms] = useState(user.offersSms);

  const [phoneError, setPhoneError] = useState("");
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState<AddressView | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const dialCountry = DIAL_CODES.find((c) => c.dial === dial)?.label ?? "";

  const reset = () => {
    setName(user.name);
    setDial(user.dial);
    setPhone(user.phone);
    setDob(user.dob);
    setOffersEmail(user.offersEmail);
    setOffersSms(user.offersSms);
    setPhoneError("");
  };

  const saveProfile = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    const phoneResult = validatePhoneForCountry(phone, dialCountry);
    if (!phoneResult.ok) {
      setPhoneError(phoneResult.error);
      toast.error(phoneResult.error);
      return;
    }
    setPhoneError("");

    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          phoneCode: dial,
          phone,
          dateOfBirth: dob || null,
          offersEmail,
          offersSms,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not save your profile.");

      toast.success("Profile updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  const setDefaultAddress = async (address: AddressView) => {
    try {
      const res = await fetch(`/api/profile/addresses/${address.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isDefault: true }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not update the default address.");
      toast.success("Default address updated.");
      router.refresh();
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Could not update the default address."
      );
    }
  };

  const deleteAddress = async (address: AddressView) => {
    try {
      const res = await fetch(`/api/profile/addresses/${address.id}`, {
        method: "DELETE",
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || "Could not delete this address.");
      toast.success("Address deleted.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not delete this address.");
    }
  };

  return (
    <>
      {/* Personal info */}
      <div className={cardCls}>
        <h2 className={h2Cls}>Personal information</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Full name">
            <Input value={name} onChange={(e) => setName(e.target.value)} />
          </Field>
          <Field label="Email">
            <Input value={user.email} disabled />
          </Field>

          <Field label="Phone number">
            <div className="flex gap-2">
              <div className="w-[9.5rem] shrink-0">
                <Select value={dial} onValueChange={setDial}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Code" />
                  </SelectTrigger>
                  <SelectContent>
                    {DIAL_CODES.map((code) => (
                      <SelectItem key={code.dial} value={code.dial}>
                        {code.dial} {code.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Input
                inputMode="numeric"
                value={phone}
                onChange={(e) => {
                  const val = e.target.value.replace(/\D/g, "");
                  setPhone(val);
                  const dialDigits = dial.replace(/\D/g, "");
                  if (dialDigits && val.startsWith(dialDigits) && val.length > dialDigits.length) {
                    setPhoneError(
                      `Don't include the country code (${dial}) — enter only the local number.`
                    );
                  } else {
                    setPhoneError("");
                  }
                }}
                placeholder="771234567"
              />
            </div>
            {phoneError && (
              <p className="mt-1 text-xs text-red-500">{phoneError}</p>
            )}
          </Field>
          <Field label="Date of birth">
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </Field>
        </div>

        <div className="mt-4 space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-fuchsia-600"
              checked={offersEmail}
              onChange={(e) => setOffersEmail(e.target.checked)}
            />
            Email me offers and secret promo codes
          </label>
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="checkbox"
              className="h-4 w-4 accent-fuchsia-600"
              checked={offersSms}
              onChange={(e) => setOffersSms(e.target.checked)}
            />
            SMS me order updates
          </label>
        </div>

        <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" className="w-full sm:w-auto" onClick={reset} disabled={busy}>
            Cancel
          </Button>
          <Button className="w-full sm:w-auto" onClick={saveProfile} disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      {/* Addresses */}
      <div className={cardCls}>
        <div className="flex items-center justify-between gap-2">
          <h2 className={h2Cls}>Saved addresses</h2>
          <Button size="sm" onClick={() => setEditing(EMPTY_ADDRESS)}>
            <Plus className="mr-1.5 h-4 w-4" /> Add
          </Button>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {addresses.map((address) => (
            <div
              key={address.id}
              className="rounded-lg border border-fuchsia-200 p-4 dark:border-fuchsia-900/50"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-semibold">
                  <MapPin className="h-4 w-4 text-fuchsia-500" /> {address.label}
                </div>
                {address.isDefault && (
                  <span className="rounded-full bg-fuchsia-100 px-2 py-0.5 text-xs font-medium text-fuchsia-800 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
                    Default
                  </span>
                )}
              </div>
              <p className="mt-2 text-sm">
                {address.line}, {address.city}
                <br />
                {address.district}, {address.province}
                <br />
                {address.country} {address.postal}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Button size="sm" variant="outline" onClick={() => setEditing(address)}>
                  <Pencil className="mr-1.5 h-3.5 w-3.5" /> Edit
                </Button>
                {!address.isDefault && (
                  <>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDefaultAddress(address)}
                    >
                      Set default
                    </Button>
                    <Button size="sm" variant="delete" onClick={() => deleteAddress(address)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>

        {addresses.length === 0 && (
          <p className={`${mutedCls} mt-4`}>You have not saved an address yet.</p>
        )}
      </div>

      {/* Danger zone */}
      <div className="rounded-xl border border-red-300 bg-red-50/40 p-4 sm:p-6 dark:border-red-900/60 dark:bg-red-950/10">
        <h2 className="flex items-center gap-2 text-base font-semibold text-red-700 sm:text-lg dark:text-red-400">
          <ShieldAlert className="h-5 w-5" /> Delete account
        </h2>
        <p className="mt-1 text-sm text-red-700/80 dark:text-red-300/80">
          Permanently delete your account, order history, reward points and saved promos. We will
          email you an OTP to confirm.
        </p>
        <Button
          variant="destructive"
          className="mt-4 w-full sm:w-auto"
          onClick={() => setDeleteOpen(true)}
        >
          Delete my account
        </Button>
      </div>

      <AddressDialog
        address={editing}
        countries={countries}
        onClose={() => setEditing(null)}
        onSaved={() => {
          setEditing(null);
          router.refresh();
        }}
      />
      <DeleteAccountDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        email={user.email}
        points={membership.points}
        tier={membership.tier}
        onDeleted={onDeleted}
      />
    </>
  );
}
