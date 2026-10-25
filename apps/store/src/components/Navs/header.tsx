"use client";

import Link from "next/link";
import { Leaf } from "lucide-react";

const navLinks = [
  { href: "/collection", label: "Collection" },
  { href: "/products",   label: "Products" },
  { href: "/offers",     label: "Offers" },
  { href: "/help",       label: "Help" },
  { href: "/contact",    label: "Contact" },
  { href: "/about",      label: "About" },
];

export default function Header() {
  return (
    <div className="w-full bg-white dark:bg-zinc-950 border-b border-fuchsia-100 dark:border-fuchsia-900/40">
      <div className="max-w-7xl mx-auto flex items-center justify-center gap-1 py-0">
        {navLinks.map((link, i) => (
          <div key={link.href} className="flex items-center">
            <Link
              href={link.href}
              className="
                relative px-4 py-3
                text-[13px] font-medium tracking-wide
                text-gray-500 dark:text-gray-400
                hover:text-fuchsia-600 dark:hover:text-fuchsia-400
                transition-colors duration-200
                group
              "
            >
              {link.label}
              {/* fuchsia underline slide-in on hover */}
              <span className="
                absolute bottom-0 left-1/2 -translate-x-1/2
                h-[2px] w-0 rounded-full
                bg-fuchsia-500 dark:bg-fuchsia-400
                group-hover:w-full
                transition-all duration-300 ease-out
              " />
            </Link>

            {/* separator — skip after last item */}
            {i < navLinks.length - 1 && (
              <span className="h-3 w-px bg-fuchsia-100 dark:bg-fuchsia-900" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}