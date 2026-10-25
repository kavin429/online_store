import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export default function StatusLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-fuchsia-50 to-gray-100 dark:from-neutral-900 dark:to-neutral-950 px-4">
      {children}
    </div>
  );
}
