import Link from "next/link";
import { Bike, Compass } from "lucide-react";
import { Button } from "@online-store/ui/button";

export default function DriverNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-5 bg-gradient-to-br from-fuchsia-50 via-white to-gray-100 px-4 text-center dark:from-gray-950 dark:via-gray-950 dark:to-fuchsia-950/30">
      <span className="flex h-16 w-16 items-center justify-center rounded-2xl bg-fuchsia-600 text-white shadow-lg shadow-fuchsia-200 dark:shadow-fuchsia-900/40">
        <Bike className="h-8 w-8" />
      </span>
      <div>
        <p className="text-sm font-semibold uppercase tracking-widest text-fuchsia-600">
          404
        </p>
        <h1 className="mt-1 text-2xl font-bold">This route doesn&apos;t exist</h1>
        <p className="mt-2 max-w-sm text-sm text-muted-foreground">
          The job or page you were looking for may have been moved or completed.
        </p>
      </div>
      <Link href="/dashboard">
        <Button>
          <Compass className="mr-2 h-4 w-4" /> Go to dashboard
        </Button>
      </Link>
    </main>
  );
}
