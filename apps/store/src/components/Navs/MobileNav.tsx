"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Package, ShoppingCart, Tag, User } from "lucide-react";
import { useCart } from "@/context/addToCard";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  {
    href: "/",
    label: "Home",
    icon: Home,
    isActive: (pathname: string) => pathname === "/",
  },
  {
    href: "/products",
    label: "Shop",
    icon: Package,
    isActive: (pathname: string) =>
      ["/products", "/categories", "/collection"].some(
        (base) => pathname === base || pathname.startsWith(`${base}/`)
      ),
  },
  {
    href: "/offers",
    label: "Offers",
    icon: Tag,
    isActive: (pathname: string) =>
      pathname === "/offers" || pathname.startsWith("/offers/"),
  },
  {
    href: "/cart",
    label: "Cart",
    icon: ShoppingCart,
    isActive: (pathname: string) =>
      pathname === "/cart" || pathname.startsWith("/cart/"),
    showCartCount: true,
  },
  {
    href: "/profile",
    label: "Account",
    icon: User,
    isActive: (pathname: string) =>
      pathname.startsWith("/profile") || pathname.startsWith("/account"),
  },
];

export default function MobileNav() {
  const pathname = usePathname();
  const { cart } = useCart();

  return (
    <nav
      aria-label="Mobile navigation"
      className="fixed inset-x-0 bottom-0 z-50 border-t border-fuchsia-100 bg-white/95 shadow-[0_-4px_20px_rgba(192,36,237,0.08)] backdrop-blur dark:border-fuchsia-900/40 dark:bg-zinc-950/95 lg:hidden"
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
                    ? "text-fuchsia-600 dark:text-fuchsia-400"
                    : "text-gray-500 hover:text-fuchsia-500 dark:text-gray-400 dark:hover:text-fuchsia-400"
                )}
              >
                {active && (
                  <span className="absolute top-0 h-0.5 w-8 rounded-full bg-fuchsia-500" />
                )}
                <span className="relative">
                  <Icon className="h-5 w-5" />
                  {item.showCartCount && cart.length > 0 && (
                    <span className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-fuchsia-500 px-1 text-[10px] font-semibold leading-none text-white">
                      {cart.length > 9 ? "9+" : cart.length}
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
