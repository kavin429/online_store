"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  CalendarDays,
  Mail,
  MapPin,
  Package,
  Phone,
  Settings,
  Star,
  Store,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";

type VendorProfile = {
  id: number;
  name: string;
  email: string;
  phone: string;
  country: string;
  province: string;
  district: string;
  city: string;
  address: string;
  status: string;
  createdAt: string;
  storeName: string | null;
};

const cardCls =
  "rounded-xl border border-fuchsia-200 bg-background p-4 shadow-sm shadow-fuchsia-100/50 sm:p-6 dark:border-fuchsia-900/50 dark:shadow-none";

const labelCls = "text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200";

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "V"
  );
}

export function VendorProfileForm({
  profile,
  stats,
}: {
  profile: VendorProfile;
  stats: { products: number; reviews: number };
}) {
  const router = useRouter();
  const [form, setForm] = useState(profile);
  const [busy, setBusy] = useState(false);

  const set = (patch: Partial<VendorProfile>) => setForm((prev) => ({ ...prev, ...patch }));

  const joined = new Date(profile.createdAt).toLocaleDateString("en-LK", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const save = async () => {
    if (!form.name.trim()) {
      toast.error("Please enter your name.");
      return;
    }
    if (!/^[0-9+\-\s()]{6,20}$/.test(form.phone)) {
      toast.error("Enter a valid phone number.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          phone: form.phone.trim(),
          country: form.country,
          province: form.province,
          district: form.district,
          city: form.city,
          address: form.address,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Could not save your profile.");

      toast.success("Profile updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save your profile.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">My profile</h1>
        <p className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
          Your vendor account and contact details.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-600 to-fuchsia-400 p-5 text-white shadow-lg dark:border-fuchsia-900/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold ring-2 ring-white/40">
          {initialsFor(profile.name)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{profile.name}</div>
          <div className="truncate text-sm text-white/80">{profile.email}</div>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              <Store className="h-3 w-3" /> {profile.storeName || "Vendor store"}
            </span>
            <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
              {profile.status}
            </span>
          </div>
        </div>
      </div>

      <div className={cardCls}>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-fuchsia-900 sm:text-lg dark:text-fuchsia-100">
            Contact details
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/dashboard/settings">
              <Settings className="mr-1.5 h-4 w-4" /> Store settings
            </Link>
          </Button>
        </div>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className={labelCls}>Full name</label>
            <Input value={form.name} onChange={(e) => set({ name: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Email</label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={profile.email} disabled className="pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Phone number</label>
            <div className="relative">
              <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.phone}
                onChange={(e) => set({ phone: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Member since</label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={joined} disabled className="pl-9" />
            </div>
          </div>

          <div className="space-y-1.5 sm:col-span-2">
            <label className={labelCls}>Street address</label>
            <div className="relative">
              <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={form.address}
                onChange={(e) => set({ address: e.target.value })}
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>City</label>
            <Input value={form.city} onChange={(e) => set({ city: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>District</label>
            <Input value={form.district} onChange={(e) => set({ district: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Province</label>
            <Input value={form.province} onChange={(e) => set({ province: e.target.value })} />
          </div>

          <div className="space-y-1.5">
            <label className={labelCls}>Country</label>
            <Input value={form.country} onChange={(e) => set({ country: e.target.value })} />
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={save} disabled={busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`${cardCls} !p-4`}>
          <Package className="h-5 w-5 text-fuchsia-500" />
          <div className="mt-2 text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">
            {stats.products}
          </div>
          <div className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
            Products in your store
          </div>
        </div>
        <div className={`${cardCls} !p-4`}>
          <Star className="h-5 w-5 text-fuchsia-500" />
          <div className="mt-2 text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">
            {stats.reviews}
          </div>
          <div className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
            Customer reviews received
          </div>
        </div>
      </div>
    </div>
  );
}
