"use client";

import { NextPage } from "next";
import { signOut } from "next-auth/react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
} from "@online-store/ui/dropdown-menu";
import { ModeToggle } from "@/components/misc/themeToggler";
import AdminNotificationBell from "@/components/AdminNotificationBell";

interface Props {
  user: { name: string; };
}

const TopNav: NextPage<Props> = ({ user }) => {
  const firstLetter =
  user?.name?.charAt(0)?.toUpperCase() ?? "A";

  const handleSignOut = async () => {
    await signOut({ callbackUrl: "/login" });
  };


  return (
    <nav className="flex justify-between items-center px-8 py-3 sticky top-0 z-50 shadow-lg bg-white dark:bg-black">
      {/* Logo */}
      <p className="text-2xl font-bold tracking-wide select-none">
        GrowMore
        <span className="font-semibold ml-1 text-fuchsia-800 dark:text-fuchsia-600">
          Online Store
        </span>
      </p>

      {/* Right menu */}
      <div className="flex items-center gap-4">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-fuchsia-200 dark:bg-fuchsia-400/30 text-fuchsia-800 dark:text-fuchsia-200 font-bold cursor-pointer shadow-lg hover:scale-105 transition">
              {firstLetter}
            </div>
          </DropdownMenuTrigger>

          <DropdownMenuContent
            align="end"
            className="w-44 rounded-lg border border-fuchsia-700 bg-fuchsia-900 text-white shadow-xl"
          >
            <DropdownMenuLabel className="text-sm font-semibold text-fuchsia-300">
              My Account
            </DropdownMenuLabel>

            <DropdownMenuItem
              onClick={handleSignOut}
              className="hover:bg-fuchsia-700 hover:text-white rounded-md cursor-pointer"
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <AdminNotificationBell />
        <ModeToggle />
      </div>
    </nav>
  );
};

export default TopNav;
