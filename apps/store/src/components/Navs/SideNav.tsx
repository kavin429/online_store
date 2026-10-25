"use client";

import * as React from "react";
import { NextPage } from "next";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, ReactElement } from "react";

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
  Users,
  ShoppingBag,
  LogOut,
  Store,
  Printer,
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
  { title: "Dashboard", icon: <LayoutGrid size={20} />, path: "/dashboard/overview" },

  {
    title: "Categories",
    icon: <Tag size={20} />,
    path: "/dashboard/categories",
  },

  {
    title: "Products",
    icon: <Package size={20} />,
    subItems: [
      { title: "All Products", icon: <Printer size={16} />, path: "/dashboard/products" },
      { title: "Create Product", icon: <Printer size={16} />, path: "/dashboard/products/add" },
    ],
  },

  {
    title: "Stores",
    icon: <Store size={20} />,
    subItems: [
      { title: "All Stores", icon: <Store size={16} />, path: "/dashboard/stores" },
      { title: "Add Store", icon: <Store size={16} />, path: "/dashboard/stores/add" },
    ],
  },

  {
    title: "Customers",
    icon: <Users size={20} />,
    path: "/dashboard/customers",
  },

  {
    title: "Orders",
    icon: <ShoppingBag size={20} />,
    path: "/dashboard/orders",
  },

  {
    title: "Logout",
    icon: <LogOut size={20} />,
    path: "/logout",
  },
];

const SideNav = ({ className }: SideNavProps) => {
  const path = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  const linkClass = (href?: string) =>
    cn(
      "flex items-center p-2 rounded-md transition-all duration-200 hover:bg-gray-100 dark:hover:bg-zinc-800",
      href === path ? "bg-zinc-100 dark:bg-zinc-800 font-medium" : "text-gray-700 dark:text-white"
    );

  return (
    <div
      className={cn(
        "sticky top-20 left-4 h-[calc(100vh-7rem)] mb-4 border rounded-lg border-zinc-200 dark:border-neutral-700 flex flex-col transition-all duration-300 overflow-hidden",
        collapsed ? "w-20" : "w-64 lg:w-64",
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-2 border-b border-zinc-200 dark:border-neutral-700">
        {!collapsed && (
          <div className="text-sm font-semibold cursor-default">
            ShoeStore Admin
          </div>
        )}
        <Button
          size="sm"
          variant="ghost"
          className="p-2 transition-colors hover:bg-gray-100 dark:hover:bg-zinc-800"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? "➤" : "◀"}
        </Button>
      </div>

      {/* Sidebar Items */}
      <div className="px-2 py-4 overflow-y-auto bg-gray-50 dark:bg-neutral-900 flex-1">
        <ul className="space-y-1 text-sm">
          {sidebarItems.map((item, idx) => (
            <li key={idx}>
              {item.subItems && item.subItems.length > 0 ? (
                <Accordion type="single" collapsible>
                  <AccordionItem value={item.title}>
                    <AccordionTrigger className="flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800 group">
                      <div className="flex items-center w-full">
                        {React.cloneElement(item.icon, {
                          className: cn(
                            "transition-colors duration-200 text-zinc-700 dark:text-white",
                            path === item.path && "text-fuchsia-800 dark:text-fuchsia-400"
                          ),
                        })}
                        {!collapsed && <span className="ml-3">{item.title}</span>}
                      </div>
                    </AccordionTrigger>

                    {!collapsed && (
                      <AccordionContent className="flex flex-col pl-6">
                        {item.subItems.map((sub, sidx) => (
                          <Link key={sidx} href={sub.path}>
                            <div
                              className={cn(
                                "flex items-center p-2 rounded-md hover:bg-gray-100 dark:hover:bg-zinc-800",
                                path === sub.path && "bg-zinc-100 dark:bg-zinc-800 font-medium"
                              )}
                            >
                              {React.cloneElement(sub.icon, {
                                className: cn(
                                  "transition-colors duration-200 text-zinc-700 dark:text-white",
                                  path === sub.path && "text-fuchsia-800 dark:text-fuchsia-400"
                                ),
                              })}
                              <span className="ml-3">{sub.title}</span>
                            </div>
                          </Link>
                        ))}
                      </AccordionContent>
                    )}
                  </AccordionItem>
                </Accordion>
              ) : (
                <Link href={item.path || "#"}>
                  <div className={linkClass(item.path)}>
                    {React.cloneElement(item.icon, {
                      className: cn(
                        "transition-colors duration-200 text-zinc-700 dark:text-white",
                        path === item.path && "text-fuchsia-800 dark:text-fuchsia-400"
                      ),
                    })}
                    {!collapsed && <span className="ml-3 flex-1">{item.title}</span>}
                  </div>
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export default SideNav;