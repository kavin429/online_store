"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Bell } from "lucide-react";

const READ_EVENT = "vendor-notifications-read";

export default function VendorNotificationBell() {
  const router = useRouter();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;

    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
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
    window.addEventListener(READ_EVENT, reset);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener(READ_EVENT, reset);
    };
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
