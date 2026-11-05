import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { Button } from "@online-store/ui/button";
import { ArrowRight, MapPin, Package, Store as StoreIcon } from "lucide-react";

export const dynamic = "force-dynamic";

type StoreCard = {
  id: number;
  name: string;
  logo: string | null;
  banner: string | null;
  description: string | null;
  location: string;
  products: number;
};

export default async function StoresPage() {
  let stores: StoreCard[] = [];

  try {
    const rows = await prisma.vendor.findMany({
      where: { status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        image: true,
        city: true,
        district: true,
        country: true,
        vendorSettings: {
          select: {
            storeName: true,
            storeLogo: true,
            storeBanner: true,
            description: true,
          },
        },
        _count: {
          select: {
            products: {
              where: {
                OR: [
                  { stock: { gt: 0 } },
                  { variants: { some: { stock: { gt: 0 } } } },
                ],
              },
            },
          },
        },
      },
    });

    stores = rows.map((row) => ({
      id: row.id,
      name:
        row.vendorSettings?.storeName?.trim() ||
        row.name?.trim() ||
        `Store #${row.id}`,
      logo: row.vendorSettings?.storeLogo || row.image || null,
      banner: row.vendorSettings?.storeBanner || null,
      description: row.vendorSettings?.description || null,
      location: [row.city, row.district, row.country].filter(Boolean).join(", "),
      products: row._count.products,
    }));
  } catch (error) {
    // A database hiccup should not take the storefront down.
    console.error("FETCH STORES ERROR:", error);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 mt-5 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-600 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-400">
          <StoreIcon className="h-3 w-3" />
          Our Stores
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Shop by store
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Browse the independent stores selling on GrowMore and explore their
          full range of products.
        </p>
      </header>

      {stores.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <StoreIcon className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">No stores are live yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon — new stores are added regularly.
          </p>
          <Button asChild variant="outline" className="mt-5">
            <Link href="/products">Browse all products</Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
          {stores.map((store) => (
            <Link
              key={store.id}
              href={`/stores/${store.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-r from-fuchsia-600 to-fuchsia-400">
                {store.banner ? (
                  <img
                    src={store.banner}
                    alt={`${store.name} banner`}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : null}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
              </div>

              <div className="relative p-5">
                <div className="-mt-12 mb-3 flex items-end justify-between">
                  {store.logo ? (
                    <img
                      src={store.logo}
                      alt={store.name}
                      className="h-16 w-16 rounded-xl border-4 border-white bg-white object-cover shadow dark:border-zinc-900 dark:bg-zinc-900"
                    />
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white bg-fuchsia-50 text-fuchsia-500 shadow dark:border-zinc-900 dark:bg-fuchsia-950">
                      <StoreIcon className="h-6 w-6" />
                    </div>
                  )}
                  <span className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-2.5 py-1 text-xs font-medium text-fuchsia-600 dark:bg-fuchsia-950 dark:text-fuchsia-400">
                    <Package className="h-3 w-3" />
                    {store.products} products
                  </span>
                </div>

                <h2 className="truncate text-lg font-semibold group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400">
                  {store.name}
                </h2>
                <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-sm text-muted-foreground">
                  {store.description || "Discover this store's products."}
                </p>

                <div className="mt-4 flex items-center justify-between gap-3">
                  <span className="inline-flex min-w-0 items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="h-3 w-3 shrink-0" />
                    <span className="truncate">{store.location || "Online"}</span>
                  </span>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-fuchsia-600 dark:text-fuchsia-400">
                    Visit
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
