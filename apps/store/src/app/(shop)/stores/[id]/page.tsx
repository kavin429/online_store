import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/Home/product-card";
import { ArrowLeft, MapPin, Package, Store as StoreIcon } from "lucide-react";

export const dynamic = "force-dynamic";

const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export default async function StorePage({
  params,
}: {
  params: { id: string };
}) {
  const id = Number(params.id);

  if (!Number.isInteger(id) || id <= 0) {
    notFound();
  }

  const vendor = await prisma.vendor.findFirst({
    where: { id, status: "ACTIVE" },
    select: {
      id: true,
      name: true,
      image: true,
      city: true,
      district: true,
      province: true,
      country: true,
      vendorSettings: {
        select: {
          storeName: true,
          storeLogo: true,
          storeBanner: true,
          description: true,
        },
      },
      products: {
        where: {
          OR: [
            { stock: { gt: 0 } },
            { variants: { some: { stock: { gt: 0 } } } },
          ],
        },
        orderBy: { createdAt: "desc" },
        take: 48,
        include: {
          images: true,
          category: true,
          variants: { select: { stock: true } },
        },
      },
    },
  });

  if (!vendor) {
    notFound();
  }

  const storeName =
    vendor.vendorSettings?.storeName?.trim() ||
    vendor.name?.trim() ||
    `Store #${vendor.id}`;
  const logo = vendor.vendorSettings?.storeLogo || vendor.image || null;
  const banner = vendor.vendorSettings?.storeBanner || null;
  const location = [vendor.city, vendor.district, vendor.province, vendor.country]
    .filter(Boolean)
    .join(", ");

  const products = vendor.products.map((product) => {
    const variantStock = product.variants.reduce(
      (total, variant) => total + (variant.stock ?? 0),
      0
    );
    const stock =
      (product.stock ?? 0) > 0 ? product.stock ?? 0 : variantStock;

    return {
      id: product.id,
      name: product.name,
      description: product.description ?? undefined,
      sellingPrice: product.sellingPrice ?? 0,
      costPrice: product.costPrice ?? 0,
      featured: product.featured,
      stock,
      images: product.images.map((image) => ({
        id: image.id,
        url: `data:image/jpeg;base64,${Buffer.from(image.data).toString(
          "base64"
        )}`,
      })),
      category: { id: product.category.id, name: product.category.name },
      store: storeName,
      isNew: Date.now() - new Date(product.createdAt).getTime() < THIRTY_DAYS,
    };
  });

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 mt-5 sm:px-6 lg:px-8">
      <Link
        href="/stores"
        className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-muted-foreground hover:text-fuchsia-600 dark:hover:text-fuchsia-400"
      >
        <ArrowLeft className="h-4 w-4" />
        All stores
      </Link>

      {/* Store header */}
      <section className="overflow-hidden rounded-2xl border bg-white shadow-sm dark:bg-zinc-900">
        <div className="relative h-44 bg-gradient-to-r from-fuchsia-600 to-fuchsia-400 sm:h-56">
          {banner ? (
            <img
              src={banner}
              alt={`${storeName} banner`}
              className="h-full w-full object-cover"
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        </div>

        <div className="relative p-5 sm:p-7">
          <div className="-mt-14 flex flex-col gap-4 sm:-mt-16 sm:flex-row sm:items-end">
            {logo ? (
              <img
                src={logo}
                alt={storeName}
                className="h-24 w-24 rounded-2xl border-4 border-white bg-white object-cover shadow-lg dark:border-zinc-900 dark:bg-zinc-900"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-fuchsia-50 text-fuchsia-500 shadow-lg dark:border-zinc-900 dark:bg-fuchsia-950">
                <StoreIcon className="h-8 w-8" />
              </div>
            )}

            <div className="min-w-0 flex-1 pb-1">
              <h1 className="truncate text-2xl font-bold sm:text-3xl">
                {storeName}
              </h1>
              <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  {products.length} product{products.length === 1 ? "" : "s"}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {location || "Online store"}
                </span>
              </div>
            </div>
          </div>

          {vendor.vendorSettings?.description ? (
            <p className="mt-5 max-w-3xl text-sm leading-relaxed text-muted-foreground">
              {vendor.vendorSettings.description}
            </p>
          ) : null}
        </div>
      </section>

      {/* Products */}
      <section className="mt-10">
        <div className="mb-5 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold sm:text-2xl">Store products</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Everything currently available from {storeName}.
            </p>
          </div>
          <Link
            href="/products"
            className="hidden text-sm font-medium text-fuchsia-600 hover:underline dark:text-fuchsia-400 sm:inline"
          >
            Browse all products
          </Link>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-16 text-center">
            <Package className="mb-3 h-9 w-9 text-muted-foreground/50" />
            <p className="font-medium">No products available right now</p>
            <p className="mt-1 text-sm text-muted-foreground">
              This store has not listed any in-stock products yet.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
