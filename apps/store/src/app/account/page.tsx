import Link from "next/link";
import { Package, TicketPercent, ShoppingBag } from "lucide-react";
import { Button } from "@online-store/ui/button";
import { Card } from "@online-store/ui/card";

export const dynamic = "force-dynamic";

export default function AccountPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100">
          My Account
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Track your orders and the offers you have claimed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-6 flex flex-col items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center">
            <Package className="h-5 w-5 text-fuchsia-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              My Orders
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              See every order you have placed and where it stands.
            </p>
          </div>
          <Link href="/account/orders">
            <Button variant="shoe">View orders</Button>
          </Link>
        </Card>

        <Card className="p-6 flex flex-col items-start gap-3">
          <div className="h-10 w-10 rounded-full bg-fuchsia-50 dark:bg-fuchsia-950 flex items-center justify-center">
            <TicketPercent className="h-5 w-5 text-fuchsia-500" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900 dark:text-gray-100">
              Claimed Offers
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Offers you claimed stay saved here.
            </p>
          </div>
          <Link href="/account/offers">
            <Button variant="shoesecondary">View offers</Button>
          </Link>
        </Card>
      </div>

      <Card className="p-6 flex items-center gap-3">
        <ShoppingBag className="h-5 w-5 text-gray-400" />
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Looking for something new?{" "}
          <Link
            href="/"
            className="text-fuchsia-600 dark:text-fuchsia-400 font-medium hover:underline"
          >
            Back to the shop
          </Link>
        </p>
      </Card>
    </div>
  );
}
