"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, History, LayoutDashboard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

const READ_EVENT = "driver-notifications-read";
const CHANGED_EVENT = "driver-notifications-changed";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Deliveries",
    icon: LayoutDashboard,
    isActive: (pathname: string) =>
      pathname === "/dashboard" || pathname.startsWith("/dashboard/deliveries"),
  },
  {
    href: "/dashboard/history",
    label: "History",
    icon: History,
    isActive: (pathname: string) =>
      pathname.startsWith("/dashboard/history") || pathname.startsWith("/dashboard/pickups"),
  },
  {
    href: "/dashboard/notifications",
    label: "Alerts",
    icon: Bell,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/notifications"),
  },
  {
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserRound,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/profile"),
  },
];

export default function DriverMobileNav() {
  const pathname = usePathname();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    let active = true;
    const load = async () => {
      try {
        const res = await fetch("/api/notifications", { cache: "no-store" });
        if (!res.ok) return;
        const json = await res.json();
        if (active) setUnreadCount(Number(json.unreadCount ?? 0));
      } catch {
        // Best effort: the bell in the top bar shows the same count.
      }
    };

    void load();
    const timer = window.setInterval(load, 45_000);
    const reset = () => setUnreadCount(0);
    window.addEventListener("focus", load);
    window.addEventListener(CHANGED_EVENT, load);
    window.addEventListener(READ_EVENT, reset);

    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", load);
      window.removeEventListener(CHANGED_EVENT, load);
      window.removeEventListener(READ_EVENT, reset);
    };
  }, []);

  return (
    <nav
      aria-label="Driver mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-fuchsia-100 bg-white/95 shadow-[0_-4px_20px_rgba(192,36,237,0.08)] backdrop-blur dark:border-neutral-800 dark:bg-neutral-950/95 sm:hidden"
    >
      <ul className="mx-auto flex max-w-md items-stretch justify-between px-2 pb-[env(safe-area-inset-bottom)]">
        {NAV_ITEMS.map((item) => {
          const active = item.isActive(pathname);
          const Icon = item.icon;

          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-fuchsia-700 dark:text-fuchsia-400"
                    : "text-gray-500 hover:text-fuchsia-600 dark:text-gray-400 dark:hover:text-fuchsia-400",
                )}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-fuchsia-600" />
                )}
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.href === "/dashboard/notifications" && unreadCount > 0 && (
                    <span className="absolute -right-2.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[9px] font-bold text-white">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </span>
                  )}
                </span>
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
