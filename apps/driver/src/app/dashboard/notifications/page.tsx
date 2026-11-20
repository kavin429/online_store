"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Bell, CheckCheck, Inbox, RefreshCw } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";
import PageHeader from "@/components/PageHeader";
import { cn } from "@/lib/utils";

const READ_EVENT = "driver-notifications-read";

type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  orderId: number | null;
  read: boolean;
  createdAt: string;
};

type Filter = "all" | "unread";

function notificationLabel(type: string) {
  if (type === "DELIVERY_ASSIGNED") return "New delivery";
  if (type.includes("PICKUP")) return "Stock pickup";
  return "Notification";
}

function notificationHref(item: NotificationItem) {
  return item.orderId ? `/dashboard/deliveries/${item.orderId}` : "/dashboard";
}

export default function DriverNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/notifications", { cache: "no-store" });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to load notifications");
      setItems((body.data ?? []) as NotificationItem[]);
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
    window.addEventListener("focus", load);
    return () => window.removeEventListener("focus", load);
  }, [load]);

  const patchRead = async (payload: Record<string, unknown>) => {
    const res = await fetch("/api/notifications", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to update notifications");
    }
  };

  const markAllRead = async () => {
    setSaving(true);
    setError(null);
    try {
      await patchRead({ markAllRead: true });
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
      window.dispatchEvent(new Event(READ_EVENT));
    } catch (err: any) {
      setError(err.message || "Failed to update notifications");
    } finally {
      setSaving(false);
    }
  };

  const markRead = async (id: number) => {
    try {
      await patchRead({ ids: [id] });
      setItems((prev) =>
        prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
      );
      window.dispatchEvent(new Event(READ_EVENT));
    } catch {
      // keep the row unchanged when the update fails
    }
  };

  const unreadCount = items.filter((item) => !item.read).length;
  const visible = useMemo(
    () => (filter === "unread" ? items.filter((item) => !item.read) : items),
    [filter, items],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Stay in the loop"
        title="Notifications"
        description="New deliveries and pickup updates assigned to you will appear here."
        actions={
          <>
            <Button variant="outline" onClick={() => void load()} disabled={loading}>
              <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
              Refresh
            </Button>
            <Button onClick={markAllRead} disabled={saving || unreadCount === 0}>
              <CheckCheck className="mr-2 h-4 w-4" />
              Mark all read
            </Button>
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({items.length})
        </Button>
        <Button
          variant={filter === "unread" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("unread")}
        >
          Unread ({unreadCount})
        </Button>
      </div>

      {error && (
        <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-600 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          {Array.from({ length: 4 }).map((_, index) => (
            <Card key={index} className="h-24 animate-pulse bg-muted/40" />
          ))}
        </div>
      ) : visible.length === 0 ? (
        <Card className="rounded-2xl border-fuchsia-100/70 p-10 text-center dark:border-fuchsia-900/30">
          <span className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-950/50 dark:text-fuchsia-300">
            <Inbox className="h-7 w-7" />
          </span>
          <p className="font-semibold">Nothing here yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {filter === "unread"
              ? "You are all caught up."
              : "New delivery assignments will appear here."}
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {visible.map((item) => (
            <Link key={item.id} href={notificationHref(item)} onClick={() => void markRead(item.id)}>
              <Card
                className={cn(
                  "flex gap-3 rounded-2xl border-fuchsia-100/70 p-4 transition hover:border-fuchsia-300 hover:shadow-sm dark:border-fuchsia-900/30",
                  !item.read && "border-fuchsia-200 bg-fuchsia-50/60 dark:border-fuchsia-900/60 dark:bg-fuchsia-950/20",
                )}
              >
                <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300">
                  <Bell className="h-4 w-4" />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold uppercase tracking-wide text-fuchsia-700 dark:text-fuchsia-400">
                      {notificationLabel(item.type)}
                    </p>
                    {!item.read && (
                      <span className="rounded-full bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 break-words text-sm font-semibold">{item.title}</p>
                  <p className="mt-0.5 break-words text-sm text-muted-foreground">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
