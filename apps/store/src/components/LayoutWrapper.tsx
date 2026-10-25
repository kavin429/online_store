// components/LayoutWrapper.tsx

"use client";

import { usePathname } from "next/navigation";
import TopNav from "@/components/Navs/TopNav";

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

      <main className={!hideNavbar ? "mt-18" : ""}>
        {children}
      </main>
    </>
  );
}