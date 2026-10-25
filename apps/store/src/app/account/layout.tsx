import Link from "next/link";
import { requireRole } from "@online-store/auth";
import { ROLES } from "@online-store/auth";
import { authOptions } from "@/lib/auth";
import { cn } from "@/lib/utils";

const NAV = [
  { href: "/account", label: "Overview" },
  { href: "/account/orders", label: "My Orders" },
  { href: "/account/offers", label: "Claimed Offers" },
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Server-side guard: the middleware blocks the request, this renders the
  // right shell and never leaks a session to an anonymous visitor.
  await requireRole(authOptions, ROLES.CUSTOMER, "/login");

  return (
    <div className="max-w-5xl mx-auto px-4 mt-20 pb-16">
      <nav className="flex flex-wrap items-center gap-2 border-b border-gray-200 dark:border-gray-800 pb-4 mb-8">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              "text-gray-600 hover:text-fuchsia-600 hover:bg-fuchsia-50 dark:text-gray-400 dark:hover:text-fuchsia-400 dark:hover:bg-fuchsia-950/40"
            )}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      {children}
    </div>
  );
}
