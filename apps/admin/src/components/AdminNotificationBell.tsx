"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Bell, BellOff, BellRing, CheckCheck, Send, UserPlus } from "lucide-react";

import { Button } from "@online-store/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@online-store/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type CustomerNotification = {
  id: number;
  name: string | null;
  email: string | null;
  phone: string | null;
  city: string | null;
  createdAt: string;
  read: boolean;
};

type StreamPayload = {
  ok?: boolean;
  recent?: Omit<CustomerNotification, "read">[];
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

function labelFor(customer: CustomerNotification) {
  return customer.name || customer.email || customer.phone || `Customer #${customer.id}`;
}

export default function AdminNotificationBell() {
  const [items, setItems] = useState<CustomerNotification[]>([]);
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState(false);
  const [pushSupported, setPushSupported] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(false);
  const [pushBusy, setPushBusy] = useState(false);
  const [testBusy, setTestBusy] = useState(false);
  const seenIds = useRef<Set<number>>(new Set());

  const unreadCount = items.filter((item) => !item.read).length;

  const addCustomers = useCallback(
    (customers: Omit<CustomerNotification, "read">[], read: boolean) => {
      if (customers.length === 0) return;

      const fresh = customers.filter((customer) => !seenIds.current.has(customer.id));
      if (fresh.length === 0) return;
      fresh.forEach((customer) => seenIds.current.add(customer.id));

      setItems((prev) => {
        const merged = [...fresh.map((customer) => ({ ...customer, read })), ...prev];
        return merged.slice(0, 50);
      });
    },
    [],
  );

  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("connected", (event) => {
      setConnected(true);
      try {
        const payload = JSON.parse((event as MessageEvent).data) as StreamPayload;
        if (payload.recent) addCustomers(payload.recent, true);
      } catch {
        // ignore malformed payloads
      }
    });

    source.addEventListener("new_customer", (event) => {
      try {
        const customer = JSON.parse((event as MessageEvent).data) as Omit<
          CustomerNotification,
          "read"
        >;
        addCustomers([customer], false);
        toast.success(`New customer: ${labelFor({ ...customer, read: false })}`, {
          description: "A new customer just registered.",
        });
      } catch {
        // ignore malformed payloads
      }
    });

    source.onerror = () => {
      setConnected(false);
    };

    return () => source.close();
  }, [addCustomers]);

  useEffect(() => {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) {
      setPushSupported(false);
      return;
    }
    navigator.serviceWorker
      .register("/sw.js")
      .then(async (reg) => {
        const existing = await reg.pushManager.getSubscription();
        setPushEnabled(!!existing);
      })
      .catch(() => setPushSupported(false));
  }, []);

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    if (next) {
      setItems((prev) => prev.map((item) => ({ ...item, read: true })));
    }
  };

  const markAllRead = () => {
    setItems((prev) => prev.map((item) => ({ ...item, read: true })));
  };

  const enablePush = async () => {
    setPushBusy(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission !== "granted") {
        setPushBusy(false);
        return;
      }

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
        ),
      });

      const json = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ endpoint: json.endpoint, keys: json.keys }),
      });

      setPushEnabled(true);
      await sendTest();
    } catch (error) {
      console.error("Push subscribe failed:", error);
      toast.error("Could not enable browser notifications");
    } finally {
      setPushBusy(false);
    }
  };

  const disablePush = async () => {
    setPushBusy(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.getSubscription();
      if (subscription) {
        await fetch("/api/push/subscribe", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ endpoint: subscription.endpoint }),
        });
        await subscription.unsubscribe();
      }
      setPushEnabled(false);
    } catch (error) {
      console.error("Push unsubscribe failed:", error);
    } finally {
      setPushBusy(false);
    }
  };

  const sendTest = async () => {
    setTestBusy(true);
    try {
      const res = await fetch("/api/notifications/test", { method: "POST" });
      if (!res.ok) throw new Error("failed");
      toast.success("Test notification sent");
    } catch (error) {
      console.error("Test notification failed:", error);
      toast.error("Failed to send test notification");
    } finally {
      setTestBusy(false);
    }
  };

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label="Notifications"
          className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40"
        >
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {unreadCount > 9 ? "9+" : unreadCount}
            </span>
          )}
        </button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-80 rounded-lg p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <div className="flex items-center gap-2">
            <p className="text-sm font-semibold">Notifications</p>
            <span
              className={cn(
                "h-2 w-2 rounded-full",
                connected ? "bg-green-500" : "bg-gray-400",
              )}
              title={connected ? "Live" : "Reconnecting"}
            />
          </div>
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={markAllRead}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all read
            </button>
          )}
        </div>

        <div className="max-h-80 overflow-y-auto">
          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-muted-foreground">
              No new notifications yet.
            </p>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className={cn(
                  "flex gap-3 border-b px-4 py-3 last:border-b-0",
                  !item.read && "bg-fuchsia-50/60 dark:bg-fuchsia-950/20",
                )}
              >
                <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-fuchsia-100 text-fuchsia-700 dark:bg-fuchsia-900/50 dark:text-fuchsia-300">
                  <UserPlus className="h-4 w-4" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{labelFor(item)}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {item.email || item.phone || "New customer registered"}
                  </p>
                  <p className="mt-0.5 text-[11px] text-muted-foreground">
                    {new Date(item.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex items-center justify-between gap-2 border-t px-3 py-2">
          {pushSupported ? (
            pushEnabled ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={disablePush}
                disabled={pushBusy}
              >
                <BellOff className="mr-2 h-4 w-4" />
                {pushBusy ? "Please wait..." : "Turn off alerts"}
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                onClick={enablePush}
                disabled={pushBusy}
              >
                <BellRing className="mr-2 h-4 w-4" />
                {pushBusy ? "Please wait..." : "Enable alerts"}
              </Button>
            )
          ) : (
            <span className="text-xs text-muted-foreground">
              Push not supported
            </span>
          )}

          <Button variant="ghost" size="sm" onClick={sendTest} disabled={testBusy}>
            <Send className="mr-2 h-4 w-4" />
            {testBusy ? "Sending..." : "Send test"}
          </Button>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
