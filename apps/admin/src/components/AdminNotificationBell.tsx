"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";
import { toast } from "sonner";

const SEEN_STORAGE_KEY = "admin-notifications-seen-at";
const SEEN_EVENT = "admin-notifications-seen";

export default function AdminNotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const since = window.localStorage.getItem(SEEN_STORAGE_KEY);
        const query = since ? `?since=${encodeURIComponent(since)}` : "";
        const res = await fetch(`/api/notifications${query}`, {
          cache: "no-store",
        });
        if (!res.ok) return;
        const json = await res.json();
        if (!active) return;
        setUnreadCount(Number(json.unreadCount ?? 0));
      } catch {
        // best effort
      }
    };

    void load();
    const timer = window.setInterval(load, 45000);

    const reset = () => setUnreadCount(0);
    window.addEventListener("focus", load);
    window.addEventListener(SEEN_EVENT, reset);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener(SEEN_EVENT, reset);
    };
  }, []);

  // Keep the live "new customer" toast that the old bell provided.
  useEffect(() => {
    const source = new EventSource("/api/notifications/stream");

    source.addEventListener("new_customer", (event) => {
      try {
        const customer = JSON.parse((event as MessageEvent).data) as {
          name?: string | null;
          email?: string | null;
        };
        toast.success(
          `New customer: ${customer.name || customer.email || "New customer"}`,
          { description: "A new customer just registered." },
        );
        setUnreadCount((count) => count + 1);
      } catch {
        // ignore malformed payloads
      }
    });

    source.addEventListener("new_quotation", (event) => {
      try {
        const data = JSON.parse((event as MessageEvent).data) as {
          title?: string;
          message?: string;
          href?: string;
        };
        toast.info(data.title || "Quotation update", {
          description: data.message,
          action: data.href
            ? { label: "View", onClick: () => router.push(data.href!) }
            : undefined,
        });
        setUnreadCount((count) => count + 1);
      } catch {
        // ignore malformed payloads
      }
    });

    return () => source.close();
  }, []);

  return (
    <button
      type="button"
      aria-label="Notifications"
      title="Notifications"
      onClick={() => router.push("/dashboard/notifications")}
      className="relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-fuchsia-100 dark:hover:bg-fuchsia-900/40"
    >
      <Bell className="h-5 w-5" />
      {unreadCount > 0 && (
        <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </button>
  );
}
