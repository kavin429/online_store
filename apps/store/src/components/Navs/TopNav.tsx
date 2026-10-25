"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useCart } from "@/context/addToCard";
import { useWishlist } from "@/context/favorite";
import { formatLKR } from "@/lib/utils";
import Header from "./header";

import {
  ChevronDown,
  Menu,
  UserCircle,
  ShoppingCart,
  Search,
  Heart,
  Leaf,
  X,
} from "lucide-react";

import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { ModeToggle } from "@/components/misc/themeToggler";
import { Card } from "@online-store/ui/card";

// ────────────────────────────────────────────
// Menu Components
// ────────────────────────────────────────────

function MenuList({ children, className }: any) {
  return (
    <ul
      className={`
        shadow-xl rounded-xl p-2
        border border-fuchsia-100 dark:border-fuchsia-900/50
        bg-white dark:bg-zinc-950
        ${className}
      `}
    >
      {children}
    </ul>
  );
}

function MenuItem({ children, onClick }: any) {
  return (
    <li
      onClick={onClick}
      className="
        cursor-pointer
        hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950
        hover:text-fuchsia-600 dark:hover:text-fuchsia-400
        px-3 py-2 rounded-lg
        text-sm text-gray-700 dark:text-gray-300
        transition-all duration-150
      "
    >
      {children}
    </li>
  );
}

// ────────────────────────────────────────────
// Profile Menu
// ────────────────────────────────────────────

function ProfileMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session } = useSession();

  if (!session) {
    return (
      <Link href="/login">
        <Button className="rounded-full bg-fuchsia-600 hover:bg-fuchsia-700 text-white px-5 text-sm">
          Login
        </Button>
      </Link>
    );
  }

  const firstLetter = session?.user?.name?.charAt(0)?.toUpperCase() ?? "A";

  return (
    <div className="relative">
      <Button
        className="flex items-center gap-2 rounded-full pl-1.5 pr-3 py-1 bg-fuchsia-500 hover:bg-fuchsia-600 text-white text-sm"
        onClick={() => setIsOpen(!isOpen)}
      >
        {/* Circular avatar badge */}
        <span className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold shrink-0">
          {firstLetter}
        </span>

        <span className="hidden sm:inline max-w-[100px] truncate">
          {session.user?.name}
        </span>

        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </Button>

      {/* Backdrop — closes dropdown on outside tap, mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {isOpen && (
        <MenuList
          className="
            fixed left-1/2 top-20 -translate-x-1/2 z-50
            w-[90vw] max-w-xs
            lg:absolute lg:left-auto lg:right-0 lg:top-full lg:translate-x-0 lg:mt-3 lg:w-56
          "
        >
          <div className="px-3 py-3 border-b border-fuchsia-50 dark:border-zinc-800 mb-1">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              {session.user?.name}
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 truncate">
              {session.user?.email}
            </p>
          </div>

          <MenuItem>
            <Link href="/profile" className="flex items-center gap-2 w-full" onClick={() => setIsOpen(false)}>
              <UserCircle className="h-4 w-4 text-fuchsia-500" />
              <span>My Profile</span>
            </Link>
          </MenuItem>

          <div className="border-t border-fuchsia-50 dark:border-zinc-800 mt-1 pt-1">
            <MenuItem onClick={() => signOut({ callbackUrl: "/login" })}>
              <div className="flex items-center gap-2 text-red-500">
                <UserCircle className="h-4 w-4" />
                <span>Sign Out</span>
              </div>
            </MenuItem>
          </div>
        </MenuList>
      )}
    </div>
  );
}
// ────────────────────────────────────────────
// Category Dropdown
// ────────────────────────────────────────────

type Category = {
  id: number;
  name: string;
  imageUrl: string | null;
};

function CategoryDropdown() {
  const [open, setOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to load categories", err);
      }
    };

    fetchCategories();
  }, []);

  const loopingCategories = [...categories];
  return (
    <div className="relative">
      <Button
        variant="outline"
        className="
          flex items-center gap-2 text-sm
          border-fuchsia-200 dark:border-fuchsia-900
          hover:border-fuchsia-400 dark:hover:border-fuchsia-700
          hover:text-fuchsia-600 dark:hover:text-fuchsia-400
          hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950
          transition-all duration-200
        "
        onClick={() => setOpen(!open)}
      >
        Categories
        <ChevronDown className={`h-4 w-4 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
      </Button>

      {open && (
        <MenuList className="absolute top-12 left-0 w-52 z-50">
          {loopingCategories.map((category) => (
            <MenuItem key={category.id}>{category.name}</MenuItem>
          ))}
        </MenuList>
      )}
    </div>
  );
}

// ────────────────────────────────────────────
// Icon Badge Button (cart / wishlist)
// ────────────────────────────────────────────

function IconBadgeBtn({ icon, count }: { icon: React.ReactNode; count: number }) {
  return (
    <div className="relative">
      <Button
        variant="outline"
        size="icon"
        className="
          rounded-full
          border-fuchsia-200 dark:border-fuchsia-900
          hover:border-fuchsia-400 dark:hover:border-fuchsia-700
          hover:bg-fuchsia-50 dark:hover:bg-fuchsia-950
          hover:text-fuchsia-600 dark:hover:text-fuchsia-400
          transition-all duration-200
        "
      >
        {icon}
      </Button>
      {count > 0 && (
        <span className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold">
          {count}
        </span>
      )}
    </div>
  );
}


// ────────────────────────────────────────────
// Cart Hover Preview
// ────────────────────────────────────────────

function CartPreviewDropdown({ cart }: { cart: any[] }) {
  const [isOpen, setIsOpen] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + (item.sellingPrice ?? item.price ?? 0) * (item.quantity ?? 1),
    0
  );

  return (
    <div className="group relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          rounded-full
          border-fuchsia-200 dark:border-fuchsia-900
          group-hover:border-fuchsia-400 dark:group-hover:border-fuchsia-700
          group-hover:bg-fuchsia-50 dark:group-hover:bg-fuchsia-950
          group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400
          transition-all duration-200
        "
      >
        <ShoppingCart className="h-5 w-5" />
      </Button>

      {cart.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold">
          {cart.length}
        </span>
      )}

      {/* Invisible bridge — only matters for hover, harmless on mobile */}
      <div className="absolute right-0 top-full h-3 w-full min-w-[320px]" />

      {/* Backdrop — closes dropdown on outside tap, mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown */}
      <div
        className={`
    fixed left-1/2 top-20 -translate-x-1/2 z-50
    w-[90vw] max-w-sm
    lg:absolute lg:left-auto lg:right-0 lg:top-full lg:translate-x-0 lg:mt-3 lg:w-80
    transition-all duration-200 ease-out
    ${isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2 lg:translate-y-1"
          }
    lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0
  `}
      >
        <Card
          className="
      shadow-xl rounded-lg p-0 overflow-hidden
      border border-fuchsia-100 dark:border-fuchsia-900/50
      bg-white dark:bg-zinc-950
    "
        >
          <div className="px-4 py-3 border-b border-fuchsia-50 dark:border-zinc-800">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Your Cart ({cart.length})
            </p>
          </div>

          {cart.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <ShoppingCart className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400">Your cart is empty</p>
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto divide-y divide-fuchsia-50 dark:divide-zinc-800">
                {cart.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-950/30 transition-colors"
                  >
                    <img
                      src={item.images?.[0]?.url || item.image || "/placeholder.png"}
                      alt={item.name}
                      className="w-12 h-12 object-cover rounded-md border border-fuchsia-50 dark:border-zinc-800 shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                        {item.name}
                      </p>
                      <p className="text-xs text-gray-400">
                        Qty {item.quantity ?? 1}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400 shrink-0">
                      {formatLKR((item.sellingPrice ?? item.price ?? 0) * (item.quantity ?? 1))}
                    </p>
                  </div>
                ))}
              </div>

              {cart.length > 4 && (
                <p className="text-xs text-center text-gray-400 py-2 border-t border-fuchsia-50 dark:border-zinc-800">
                  +{cart.length - 4} more item{cart.length - 4 > 1 ? "s" : ""}
                </p>
              )}

              <div className="px-4 py-3 border-t border-fuchsia-50 dark:border-zinc-800 space-y-2">
                <div className="flex items-center justify-between text-sm font-semibold">
                  <span className="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span className="text-gray-900 dark:text-gray-100">{formatLKR(subtotal)}</span>
                </div>
                <Link href="/cart" onClick={() => setIsOpen(false)}>
                  <Button variant="shoe" className="w-full text-sm">
                    View Cart
                  </Button>
                </Link>
              </div>
            </>
          )}
        </Card>
      </div>
    </div>
  );
}


// ────────────────────────────────────────────
// Wishlist Hover Preview
// ────────────────────────────────────────────

function WishlistPreviewDropdown({ wishlist, removeFromWishlist }: { wishlist: any[]; removeFromWishlist: (id: number) => void }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="group relative">
      <Button
        variant="outline"
        size="icon"
        onClick={() => setIsOpen((prev) => !prev)}
        className="
          rounded-full
          border-fuchsia-200 dark:border-fuchsia-900
          group-hover:border-fuchsia-400 dark:group-hover:border-fuchsia-700
          group-hover:bg-fuchsia-50 dark:group-hover:bg-fuchsia-950
          group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400
          transition-all duration-200
        "
      >
        <Heart className="h-5 w-5" />
      </Button>

      {wishlist.length > 0 && (
        <span className="absolute -top-2 -right-2 bg-fuchsia-500 text-white text-xs w-5 h-5 flex items-center justify-center rounded-full font-semibold">
          {wishlist.length}
        </span>
      )}

      {/* Invisible bridge — only matters for hover, harmless on mobile */}
      <div className="absolute right-0 top-full h-3 w-full min-w-[320px]" />

      {/* Backdrop — closes dropdown on outside tap, mobile only */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Dropdown */}
      <div
        className={`
          fixed left-1/2 top-20 -translate-x-1/2 z-50
          w-[90vw] max-w-sm
          lg:absolute lg:left-auto lg:right-0 lg:top-full lg:translate-x-0 lg:mt-3 lg:w-80
          transition-all duration-200 ease-out
          ${isOpen
            ? "opacity-100 visible translate-y-0"
            : "opacity-0 invisible -translate-y-2 lg:translate-y-1"
          }
          lg:group-hover:opacity-100 lg:group-hover:visible lg:group-hover:translate-y-0
        `}
      >
        <Card
          className="
            shadow-xl rounded-lg p-0 overflow-hidden
            border border-fuchsia-100 dark:border-fuchsia-900/50
            bg-white dark:bg-zinc-950
          "
        >
          <div className="px-4 py-3 border-b border-fuchsia-50 dark:border-zinc-800">
            <p className="font-semibold text-sm text-gray-900 dark:text-gray-100">
              Your Wishlist ({wishlist.length})
            </p>
          </div>

          {wishlist.length === 0 ? (
            <div className="px-4 py-8 text-center">
              <Heart className="h-8 w-8 mx-auto text-gray-300 dark:text-gray-700 mb-2" />
              <p className="text-sm text-gray-400">Your wishlist is empty</p>
            </div>
          ) : (
            <>
              <div className="max-h-72 overflow-y-auto divide-y divide-fuchsia-50 dark:divide-zinc-800">
                {wishlist.slice(0, 4).map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-fuchsia-50/50 dark:hover:bg-fuchsia-950/30 transition-colors"
                  >
                    <Link
                      href={`/products/${item.id}`}
                      onClick={() => setIsOpen(false)}
                      className="flex items-center gap-3 flex-1 min-w-0"
                    >
                      <img
                        src={item.images?.[0]?.url || item.image || "/placeholder.png"}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded-md border border-fuchsia-50 dark:border-zinc-800 shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                          {item.name}
                        </p>
                        <p className="text-xs text-gray-400">
                          {formatLKR(item.sellingPrice ?? item.price ?? 0)}
                        </p>
                      </div>
                    </Link>
                    <button
                      onClick={() => removeFromWishlist(item.id)}
                      className="text-gray-300 hover:text-red-500 transition-colors shrink-0"
                      aria-label="Remove from wishlist"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>

              {wishlist.length > 4 && (
                <p className="text-xs text-center text-gray-400 py-2 border-t border-fuchsia-50 dark:border-zinc-800">
                  +{wishlist.length - 4} more item{wishlist.length - 4 > 1 ? "s" : ""}
                </p>
              )}

              {/* <div className="px-4 py-3 border-t border-fuchsia-50 dark:border-zinc-800">
                <Link href="/wishlist" onClick={() => setIsOpen(false)}>
                  <Button variant="shoe" className="w-full text-sm">
                    View Wishlist
                  </Button>
                </Link>
              </div> */}
            </>
          )}
        </Card>
      </div>
    </div>
  );
}
// ────────────────────────────────────────────
// Main Navbar
// ────────────────────────────────────────────

export default function ComplexNavbar() {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const { wishlist, removeFromWishlist } = useWishlist();
  const { cart } = useCart();

  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) setIsMobileNavOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full z-50">

      {/* ── TOP NAVBAR ── */}
      <div className="bg-white dark:bg-zinc-950 border-b border-fuchsia-100 dark:border-fuchsia-900/40 shadow-sm shadow-fuchsia-50 dark:shadow-none px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-4 py-3">

          {/* LOGO */}
          <Link href="/" className="flex items-center gap-2.5 shrink-0">
            <div className="w-8 h-8 rounded-[9px] bg-gradient-to-br from-fuchsia-600 to-fuchsia-900 flex items-center justify-center shadow-[0_2px_8px_rgba(192,36,237,0.3)]">
              <Leaf size={15} className="text-fuchsia-100" />
            </div>
            <span className="text-[20px] font-extrabold tracking-tight text-gray-900 dark:text-white">
              Grow<span className="text-fuchsia-500">More</span>
            </span>
          </Link>

          {/* CATEGORIES (desktop) */}
          <div className="hidden lg:block">
            <CategoryDropdown />
          </div>

          {/* SEARCH */}
          <div className="hidden md:flex flex-1 relative">
            <Input
              placeholder="Search products..."
              className="
                pr-10 rounded-full
                border-fuchsia-200 dark:border-fuchsia-900
                focus-visible:ring-fuchsia-400
                bg-fuchsia-50/40 dark:bg-fuchsia-950/20
                placeholder:text-gray-400
              "
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>

          {/* RIGHT — desktop */}
          <div className="hidden lg:flex items-center gap-3 ml-auto">
            <CartPreviewDropdown cart={cart} />
            <WishlistPreviewDropdown wishlist={wishlist} removeFromWishlist={removeFromWishlist} />
            <ModeToggle />
            <ProfileMenu />
          </div>

          {/* MOBILE MENU TOGGLE */}
          <Button
            size="icon"
            className="lg:hidden ml-auto rounded-full bg-fuchsia-500 hover:bg-fuchsia-600 text-white shadow-sm"
            onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
          >
            {isMobileNavOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* ── SECONDARY NAV (Header) ── */}
      <Header />

      {/* ── MOBILE PANEL ── */}
      {isMobileNavOpen && (
        <div className="lg:hidden bg-white dark:bg-zinc-950 border-b border-fuchsia-100 dark:border-fuchsia-900/40 shadow-lg">
          <div className="p-4 flex flex-col gap-4">

            {/* Search */}
            <div className="relative">
              <Input
                placeholder="Search products..."
                className="
            pr-10 rounded-full
            border-fuchsia-200 dark:border-fuchsia-900
            focus-visible:ring-fuchsia-400
            bg-fuchsia-50/40 dark:bg-fuchsia-950/20
          "
              />
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <CategoryDropdown />
              <CartPreviewDropdown cart={cart} />
              <WishlistPreviewDropdown wishlist={wishlist} removeFromWishlist={removeFromWishlist} />
              <ModeToggle />
              <ProfileMenu />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}