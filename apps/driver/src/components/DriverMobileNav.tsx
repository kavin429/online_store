"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { History, LayoutDashboard, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";

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
    isActive: (pathname: string) => pathname.startsWith("/dashboard/history"),
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
                className={cn(
                  "relative flex h-16 flex-col items-center justify-center gap-1 text-[11px] font-medium transition-colors",
                  active
                    ? "text-fuchsia-700 dark:text-fuchsia-400"
                    : "text-gray-500 hover:text-fuchsia-600 dark:text-gray-400 dark:hover:text-fuchsia-400"
                )}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-fuchsia-600" />
                )}
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
