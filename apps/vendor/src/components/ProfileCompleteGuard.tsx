"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Spinner } from "@online-store/ui/spinner";

export default function ProfileCompleteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const redirected = useRef(false);

  useEffect(() => {
    if (pathname !== "/dashboard/settings" && !redirected.current) {
      redirected.current = true;
      router.replace("/dashboard/settings");
    }
  }, [pathname, router]);

  if (pathname === "/dashboard/settings") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white dark:bg-neutral-950">
      <Spinner className="h-8 w-8 animate-spin" />
    </div>
  );
}