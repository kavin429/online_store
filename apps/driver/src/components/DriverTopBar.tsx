"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bike, History, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/misc/themeToggler";
import DriverNotificationBell from "@/components/DriverNotificationBell";

const NAV = [
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
    href: "/dashboard/profile",
    label: "Profile",
    icon: UserRound,
    isActive: (pathname: string) => pathname.startsWith("/dashboard/profile"),
  },
];

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export default function DriverTopBar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-fuchsia-100/80 bg-white/90 backdrop-blur-xl dark:border-neutral-800 dark:bg-neutral-950/90">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className="flex items-center gap-2.5 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-fuchsia-500 to-fuchsia-700 text-white shadow-md shadow-fuchsia-200 dark:shadow-fuchsia-900/40">
            <Bike className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold tracking-tight sm:text-base">
            GrowMore <span className="text-fuchsia-700 dark:text-fuchsia-400">Driver</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <nav aria-label="Driver navigation" className="hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active = item.isActive(pathname);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-current={active ? "page" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-fuchsia-500",
                    active
                      ? "bg-fuchsia-600 text-white shadow-sm shadow-fuchsia-200 dark:shadow-fuchsia-900/40"
                      : "text-gray-600 hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:text-gray-300 dark:hover:bg-fuchsia-950/40 dark:hover:text-fuchsia-300",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mx-1 hidden h-6 w-px bg-fuchsia-100 lg:block dark:bg-neutral-800" />

          <DriverNotificationBell />
          <ModeToggle />

          <div className="ml-1 hidden items-center gap-2 rounded-full border border-fuchsia-100 py-1 pl-1 pr-2.5 dark:border-neutral-800 sm:flex">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-fuchsia-100 text-[11px] font-bold text-fuchsia-700 dark:bg-fuchsia-950/60 dark:text-fuchsia-300">
              {initials(name)}
            </span>
            <span className="max-w-24 truncate text-xs font-medium text-muted-foreground">
              {name.split(" ")[0]}
            </span>
          </div>

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={`Sign out ${name}`}
            aria-label="Sign out"
            className="ml-1 flex h-9 w-9 items-center justify-center rounded-full text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 sm:w-auto sm:gap-1.5 sm:px-3 dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
