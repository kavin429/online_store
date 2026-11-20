// components/LayoutWrapper.tsx

"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/Navs/TopNav";
import MobileNav from "@/components/Navs/MobileNav";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const hideNavbar =
    pathname === "/login" ||
    pathname === "/register";

  return (
    <>
      {!hideNavbar && <TopNav />}

      <main className={!hideNavbar ? "pt-2 sm:pt-4 lg:pt-8 pb-20 lg:pb-0" : ""}>
        {children}
      </main>

      {!hideNavbar && <MobileNav />}
    </>
  );
}