"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  Mail,
  MessageSquare,
  ShieldCheck,
  Ticket,
  UserRound,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";

type AdminProfile = {
  id: number;
  name: string;
  email: string;
  createdAt: string | null;
  readOnly: boolean;
};

const cardCls =
  "rounded-xl border border-fuchsia-200 bg-background p-4 shadow-sm shadow-fuchsia-100/50 sm:p-6 dark:border-fuchsia-900/50 dark:shadow-none";

function initialsFor(name: string) {
  return (
    name
      .split(" ")
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase() || "A"
  );
}

export function AdminProfileForm({
  profile,
  stats,
}: {
  profile: AdminProfile;
  stats: { promos: number; replies: number };
}) {
  const router = useRouter();
  const [name, setName] = useState(profile.name);
  const [busy, setBusy] = useState(false);

  const joined = profile.createdAt
    ? new Date(profile.createdAt).toLocaleDateString("en-LK", {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "—";

  const save = async () => {
    if (!name.trim()) {
      toast.error("Please enter your name.");
      return;
    }

    setBusy(true);
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim() }),
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
          Your administrator account and activity.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-4 rounded-xl border border-fuchsia-200 bg-gradient-to-br from-fuchsia-600 to-fuchsia-400 p-5 text-white shadow-lg dark:border-fuchsia-900/50">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white/20 text-xl font-bold ring-2 ring-white/40">
          {initialsFor(profile.name)}
        </div>
        <div className="min-w-0">
          <div className="truncate text-lg font-semibold">{profile.name}</div>
          <div className="truncate text-sm text-white/80">{profile.email}</div>
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold">
            <ShieldCheck className="h-3 w-3" /> Administrator
          </span>
        </div>
      </div>

      {profile.readOnly && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
          This bootstrap administrator is configured through environment variables. Change
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/50">
            NEXT_PUBLIC_ADMIN_USERNAME
          </code>
          and
          <code className="mx-1 rounded bg-amber-100 px-1 py-0.5 dark:bg-amber-900/50">
            NEXT_PUBLIC_ADMIN_PASSWORD
          </code>
          to update it.
        </div>
      )}

      <div className={cardCls}>
        <h2 className="text-base font-semibold text-fuchsia-900 sm:text-lg dark:text-fuchsia-100">
          Account details
        </h2>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200">
              Full name
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={profile.readOnly || busy}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200">
              Email
            </label>
            <div className="relative">
              <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={profile.email} disabled className="pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200">
              Role
            </label>
            <div className="relative">
              <UserRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value="Administrator" disabled className="pl-9" />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-fuchsia-900 dark:text-fuchsia-200">
              Member since
            </label>
            <div className="relative">
              <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input value={joined} disabled className="pl-9" />
            </div>
          </div>
        </div>

        <div className="mt-5 flex justify-end">
          <Button onClick={save} disabled={profile.readOnly || busy}>
            {busy ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className={`${cardCls} !p-4`}>
          <Ticket className="h-5 w-5 text-fuchsia-500" />
          <div className="mt-2 text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">
            {stats.promos}
          </div>
          <div className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
            Promo codes created
          </div>
        </div>
        <div className={`${cardCls} !p-4`}>
          <MessageSquare className="h-5 w-5 text-fuchsia-500" />
          <div className="mt-2 text-2xl font-bold text-fuchsia-900 dark:text-fuchsia-100">
            {stats.replies}
          </div>
          <div className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
            Review replies posted
          </div>
        </div>
      </div>
    </div>
  );
}
