"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  CheckCheck,
  FileText,
  Inbox,
  RefreshCw,
  UserPlus,
} from "lucide-react";

import { Button } from "@online-store/ui/button";
import { cn } from "@/lib/utils";
import PushPermissionButton from "@/components/push-permission-button";

const SEEN_STORAGE_KEY = "admin-notifications-seen-at";
const SEEN_EVENT = "admin-notifications-seen";

type NotificationItem = {
  id: string;
  type: "CUSTOMER" | "QUOTATION";
  title: string;
  message: string;
  href: string;
  createdAt: string;
  read: boolean;
};

type Filter = "all" | "new";

export default function AdminNotificationsPage() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [highlighted, setHighlighted] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [serverTime, setServerTime] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const since = window.localStorage.getItem(SEEN_STORAGE_KEY);
      const query = since ? `?since=${encodeURIComponent(since)}` : "";
      const res = await fetch(`/api/notifications${query}`, {
        cache: "no-store",
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.error || "Failed to load notifications");

      const next = (body.data ?? []) as NotificationItem[];
      setItems(next);
      setHighlighted(new Set(next.filter((item) => !item.read).map((item) => item.id)));
      setServerTime(body.serverTime ?? new Date().toISOString());
    } catch (err: any) {
      setError(err.message || "Failed to load notifications");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  // Opening the page clears the bell badge, but items already shown as new
  // stay highlighted until the user marks them as read.
  useEffect(() => {
    if (!serverTime) return;
    window.localStorage.setItem(SEEN_STORAGE_KEY, serverTime);
    window.dispatchEvent(new Event(SEEN_EVENT));
  }, [serverTime]);

  const markAllRead = () => {
    setHighlighted(new Set());
    window.localStorage.setItem(SEEN_STORAGE_KEY, new Date().toISOString());
    window.dispatchEvent(new Event(SEEN_EVENT));
  };

  const markRead = (id: string) => {
    setHighlighted((prev) => {
      if (!prev.has(id)) return prev;
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
  };

  const visible = useMemo(
    () => (filter === "new" ? items.filter((item) => highlighted.has(item.id)) : items),
    [filter, items, highlighted],
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-xs text-muted-foreground">
            Customer sign-ups and vendor quotation updates in one place.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <PushPermissionButton />
          <Button variant="outline" onClick={() => void load()} disabled={loading}>
            <RefreshCw className={cn("mr-2 h-4 w-4", loading && "animate-spin")} />
            Refresh
          </Button>
          <Button onClick={markAllRead} disabled={highlighted.size === 0}>
            <CheckCheck className="mr-2 h-4 w-4" />
            Mark all read
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("all")}
        >
          All ({items.length})
        </Button>
        <Button
          variant={filter === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => setFilter("new")}
        >
          Unread ({highlighted.size})
        </Button>
      </div>

      {error && (
        <p className="rounded-md bg-red-50 p-3 text-sm text-red-600 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}

      <div className="overflow-hidden rounded-lg border bg-background">
        {loading && items.length === 0 ? (
          <p className="px-4 py-10 text-center text-sm text-muted-foreground">
            Loading notifications…
          </p>
        ) : visible.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
            <Inbox className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm font-medium">Nothing here yet</p>
            <p className="text-xs text-muted-foreground">
              {filter === "new"
                ? "You are all caught up."
                : "New customer and quotation activity will appear here."}
            </p>
          </div>
        ) : (
          visible.map((item) => {
            const isNew = highlighted.has(item.id);
            return (
              <Link
                key={item.id}
                href={item.href}
                onClick={() => markRead(item.id)}
                className={cn(
                  "flex gap-3 border-b px-4 py-3 transition-colors last:border-b-0 hover:bg-muted/50",
                  isNew && "bg-fuchsia-50/60 dark:bg-fuchsia-950/20",
                )}
              >
                <span
                  className={cn(
                    "mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full",
                    item.type === "QUOTATION"
                      ? "bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-300"
                      : "bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300",
                  )}
                >
                  {item.type === "QUOTATION" ? (
                    <FileText className="h-4 w-4" />
                  ) : (
                    <UserPlus className="h-4 w-4" />
                  )}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium">{item.title}</p>
                    {isNew && (
                      <span className="rounded-full bg-fuchsia-600 px-1.5 py-0.5 text-[10px] font-semibold text-white">
                        New
                      </span>
                    )}
                  </div>
                  <p className="mt-0.5 break-words text-xs text-muted-foreground">
                    {item.message}
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
