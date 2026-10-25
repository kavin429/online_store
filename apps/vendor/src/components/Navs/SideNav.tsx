"use client";

import * as React from "react";
import { NextPage } from "next";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
  List,
  PlusCircle,
  SlidersHorizontal,
  BarChart3,
  DollarSign,
  Star,
  Settings,
  Truck,
  RotateCcw,
  Bell,
  ClipboardList,
  BadgePercent,
} from "lucide-react";

interface SideNavProps {
  className?: string;
  role?: "admin" | "vendor";
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
  vendorHidden?: boolean;
}

const sidebarItems: SidebarItem[] = [
  { title: "Dashboard", icon: <LayoutGrid size={20} />, path: "/dashboard/overview" },

  {
    title: "Categories",
    icon: <Tag size={20} />,
    path: "/dashboard/categories",
    vendorHidden: true,
  },

  {
    title: "Products",
    icon: <Package size={20} />,
    subItems: [
      { title: "Create Product", icon: <PlusCircle size={16} />, path: "/dashboard/products/add" },
      { title: "All Products", icon: <List size={16} />, path: "/dashboard/products/list" },
    ],
  },

  {
    title: "Inventory",
    icon: <ClipboardList size={20} />,
    path: "/dashboard/inventory",
  },

  {
    title: "Offers",
    icon: <BadgePercent size={20} />,
    path: "/dashboard/offers",
  },

  {
    title: "Orders",
    icon: <ShoppingBag size={20} />,
    path: "/dashboard/orders",
  },

  {
    title: "Returns",
    icon: <RotateCcw size={20} />,
    path: "/dashboard/returns",
  },

  {
    title: "Reviews",
    icon: <Star size={20} />,
    path: "/dashboard/reviews",
  },

  {
    title: "Payouts",
    icon: <DollarSign size={20} />,
    path: "/dashboard/payouts",
  },

  {
    title: "Shipping",
    icon: <Truck size={20} />,
    path: "/dashboard/shipping",
  },

  {
    title: "Settings",
    icon: <Settings size={20} />,
    path: "/dashboard/settings",
  },

  {
    title: "Vendors",
    icon: <Users size={20} />,
    path: "/dashboard/vendors",
    vendorHidden: true,
  },

  {
    title: "Stores",
    icon: <Store size={20} />,
    subItems: [
      { title: "All Stores", icon: <List size={16} />, path: "/dashboard/stores" },
      { title: "Add Store", icon: <PlusCircle size={16} />, path: "/dashboard/stores/add" },
    ],
    vendorHidden: true,
  },
  {
    title: "Customers",
    icon: <Users size={20} />,
    path: "/dashboard/customers",
    vendorHidden: true,
  },

  {
    title: "Logout",
    icon: <LogOut size={20} />,
  },
];

const SideNav: NextPage<SideNavProps> = ({ className, role = "vendor" }) => {
  const path = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const filteredItems = sidebarItems.filter((item) => {
    if (role === "vendor" && item.vendorHidden) return false;
    return true;
  });

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {}
    router.push("/login");
  };

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
            {role === "vendor" ? "ShoeStore Vendor" : "ShoeStore Admin"}
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
          {filteredItems.map((item, idx) => (
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
              ) : item.title === "Logout" ? (
                <button onClick={handleLogout} className="w-full">
                  <div className={linkClass()}>
                    {React.cloneElement(item.icon, {
                      className: "transition-colors duration-200 text-zinc-700 dark:text-white",
                    })}
                    {!collapsed && <span className="ml-3 flex-1">{item.title}</span>}
                  </div>
                </button>
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
