"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { Bike, History, LayoutDashboard, LogOut, UserRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { ModeToggle } from "@/components/misc/themeToggler";

const NAV = [
  { href: "/dashboard", label: "Deliveries", icon: LayoutDashboard },
  { href: "/dashboard/history", label: "History", icon: History },
  { href: "/dashboard/profile", label: "Profile", icon: UserRound },
];

export default function DriverTopBar({ name }: { name: string }) {
  const pathname = usePathname();

  return (
    <header className="border-b border-fuchsia-100 bg-white dark:border-neutral-800 dark:bg-neutral-950">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
        <Link href="/dashboard" className="flex items-center gap-2">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-fuchsia-600 text-white">
            <Bike className="h-5 w-5" />
          </span>
          <span className="text-sm font-bold sm:text-base">
            GrowMore <span className="text-fuchsia-700 dark:text-fuchsia-400">Driver</span>
          </span>
        </Link>

        <div className="flex items-center gap-1">
          <div className="hidden items-center gap-1 sm:flex">
            {NAV.map((item) => {
              const active =
                item.href === "/dashboard"
                  ? pathname === "/dashboard" || pathname.startsWith("/dashboard/deliveries")
                  : pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium transition-colors sm:text-sm",
                    active
                      ? "bg-fuchsia-600 text-white"
                      : "text-gray-600 hover:bg-fuchsia-50 hover:text-fuchsia-700 dark:text-gray-300 dark:hover:bg-fuchsia-950/40",
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden sm:inline">{item.label}</span>
                </Link>
              );
            })}
          </div>

          <ModeToggle />

          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/login" })}
            title={`Sign out ${name}`}
            className="ml-1 flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600 sm:text-sm dark:hover:bg-red-950/30"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      </div>
    </header>
  );
}
