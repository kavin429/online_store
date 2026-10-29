"use client";

import * as React from "react";
import { NextPage } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactElement } from "react";
import { signOut } from "next-auth/react";

import { cn } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@online-store/ui/accordion";

import {
  LayoutGrid,
  Tag,
  Package,
  Truck,
  ShoppingBag,
  LogOut,
  Store,
  List,
  PlusCircle,
  SlidersHorizontal,
  UserRound,
  Percent,
  Ticket,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface SideNavProps {
  className?: string;
}

interface SidebarSubItem {
  title: string;
  icon: ReactElement;
  path: string;
}

interface SidebarItem {
  title: string;
  icon: ReactElement;
  path?: string;
  subItems?: SidebarSubItem[];
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: <LayoutGrid size={18} />, path: "/dashboard/overview" },
  { title: "Categories", icon: <Tag size={18} />, path: "/dashboard/categories" },
  {
    title: "Products",
    icon: <Package size={18} />,
    subItems: [
      { title: "Product Variants", icon: <SlidersHorizontal size={14} />, path: "/dashboard/variant" },
      { title: "Create Product", icon: <PlusCircle size={14} />, path: "/dashboard/products/add" },
      { title: "All Products", icon: <List size={14} />, path: "/dashboard/products/list" },
    ],
  },
  { title: "Vendors", icon: <Truck size={18} />, path: "/dashboard/vendors" },
  { title: "Stores", icon: <Store size={18} />, path: "/dashboard/stores" },
  { title: "Customers", icon: <UserRound size={18} />, path: "/dashboard/customers" },
  { title: "Orders", icon: <ShoppingBag size={18} />, path: "/dashboard/orders" },
  { title: "Offers", icon: <Percent size={18} />, path: "/dashboard/offers" },
  { title: "Promos", icon: <Ticket size={18} />, path: "/dashboard/promos" },
];

/* ---------- accent theme (single place to change the color) ----------
   Uses fuchsia to match the dashboard's brand color.
   To use your own token, replace every "fuchsia-500" with "shoesecondary"
   (and make sure it is defined in tailwind.config). */
const A = {
  text: "text-fuchsia-500 dark:text-fuchsia-400",
  activeRow:
    "bg-fuchsia-500/10 text-fuchsia-500 dark:text-fuchsia-300 font-medium ring-1 ring-fuchsia-500/30 shadow-[0_0_14px_-2px] shadow-fuchsia-500/40",
  hoverRow: "hover:bg-fuchsia-500/5 hover:text-fuchsia-500 dark:hover:text-fuchsia-300",
  iconGlow: "drop-shadow-[0_0_6px_theme(colors.fuchsia.500)]",
  iconHover: "group-hover:text-fuchsia-500",
  bar: "bg-fuchsia-500 shadow-[0_0_8px_1px] shadow-fuchsia-500/70",
  dot: "bg-fuchsia-500 shadow-[0_0_10px_2px] shadow-fuchsia-500/70",
  rail: "border-fuchsia-500/20",
  chevron: "text-zinc-500 hover:bg-fuchsia-500/10 hover:text-fuchsia-500",
};

const iconClass = (active: boolean) =>
  cn(
    "shrink-0 transition-all duration-200",
    active ? cn(A.text, A.iconGlow) : cn("text-zinc-500 dark:text-zinc-400", A.iconHover)
  );

const rowClass = (active: boolean, collapsed: boolean) =>
  cn(
    "group relative flex items-center rounded-md text-[13px] transition-all duration-200",
    collapsed ? "justify-center p-2" : "gap-2.5 px-2.5 py-1.5",
    active ? A.activeRow : cn("text-zinc-700 dark:text-zinc-300", A.hoverRow)
  );

const ActiveBar = ({ active }: { active: boolean }) =>
  active ? (
    <span
      aria-hidden
      className={cn("absolute left-0 top-1/2 h-4 w-0.5 -translate-y-1/2 rounded-full", A.bar)}
    />
  ) : null;

const SideNav: NextPage<SideNavProps> = ({ className }) => {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [openItem, setOpenItem] = useState<string>("");

  return (
    <div
      className={cn(
        "flex h-full shrink-0 flex-col overflow-hidden rounded-lg border",
        "border-zinc-200 bg-white dark:border-neutral-800 dark:bg-neutral-950",
        "transition-all duration-300",
        // 208px expanded (was 256) so it no longer overlaps the page content
        collapsed ? "w-16" : "w-52",
        className
      )}
    >
      {/* Header */}
      <div
        className={cn(
          "flex items-center border-b border-zinc-200 p-2 dark:border-neutral-800",
          collapsed ? "justify-center" : "justify-between"
        )}
      >
        {!collapsed && (
          <div className="flex cursor-default items-center gap-2 pl-1 text-sm font-semibold">
            <span className={cn("h-2 w-2 rounded-full", A.dot)} />
            ShoeStore Admin
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          className={cn("h-7 w-7 p-0", A.chevron)}
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <ChevronsRight size={16} /> : <ChevronsLeft size={16} />}
        </Button>
      </div>

      {/* Scrollable items (min-h-0 lets this area shrink so the footer never gets clipped) */}
      <div
        className={cn(
          "min-h-0 flex-1 overflow-y-auto bg-gray-50/60 px-2 py-3 dark:bg-neutral-900/60",
          "[scrollbar-width:thin] [scrollbar-color:theme(colors.zinc.700)_transparent]"
        )}
      >
        <ul className="space-y-0.5">
          {sidebarItems.map((item) => {
            const hasSub = !!item.subItems?.length;
            const childActive = hasSub && item.subItems!.some((s) => s.path === path);
            const active = item.path ? item.path === path : childActive;

            return (
              <li key={item.title}>
                {hasSub ? (
                  <Accordion
                    type="single"
                    collapsible
                    value={collapsed ? "" : openItem}
                    onValueChange={setOpenItem}
                  >
                    <AccordionItem value={item.title} className="border-none">
                      <AccordionTrigger
                        title={collapsed ? item.title : undefined}
                        onClick={() => {
                          // collapsed: expand the sidebar so sub-links are reachable
                          if (collapsed) {
                            setCollapsed(false);
                            setOpenItem(item.title);
                          }
                        }}
                        className={cn(
                          rowClass(active, collapsed),
                          "w-full hover:no-underline",
                          "[&>svg:last-child]:h-3.5 [&>svg:last-child]:w-3.5",
                          collapsed && "[&>svg:last-child]:hidden"
                        )}
                      >
                        <ActiveBar active={active} />
                        <div className="flex w-full items-center gap-2.5">
                          {React.cloneElement(item.icon, { className: iconClass(active) } as any)}
                          {!collapsed && <span>{item.title}</span>}
                        </div>
                      </AccordionTrigger>

                      {!collapsed && (
                        <AccordionContent
                          className={cn("ml-4 flex flex-col gap-0.5 border-l pb-1 pl-2 pt-0.5", A.rail)}
                        >
                          {item.subItems!.map((sub) => {
                            const subActive = sub.path === path;
                            return (
                              <Link key={sub.path} href={sub.path}>
                                <div className={cn(rowClass(subActive, false), "py-1 text-xs")}>
                                  <ActiveBar active={subActive} />
                                  {React.cloneElement(sub.icon, { className: iconClass(subActive) } as any)}
                                  <span>{sub.title}</span>
                                </div>
                              </Link>
                            );
                          })}
                        </AccordionContent>
                      )}
                    </AccordionItem>
                  </Accordion>
                ) : (
                  <Link href={item.path || "#"} title={collapsed ? item.title : undefined}>
                    <div className={rowClass(active, collapsed)}>
                      <ActiveBar active={active} />
                      {React.cloneElement(item.icon, { className: iconClass(active) } as any)}
                      {!collapsed && <span className="flex-1">{item.title}</span>}
                    </div>
                  </Link>
                )}
              </li>
            );
          })}
        </ul>
      </div>

      {/* Pinned footer: Logout is always visible, never scrolled away */}
      <div className="border-t border-zinc-200 p-2 dark:border-neutral-800">
        <button
          type="button"
          title={collapsed ? "Logout" : undefined}
          onClick={() => signOut({ callbackUrl: "/login" })}
          className={cn(
            rowClass(false, collapsed),
            "w-full text-left hover:bg-red-500/10 hover:text-red-500"
          )}
        >
          <LogOut
            size={18}
            className="shrink-0 text-zinc-500 transition-colors group-hover:text-red-500"
          />
          {!collapsed && <span className="flex-1">Logout</span>}
        </button>
      </div>
    </div>
  );
};

export default SideNav;