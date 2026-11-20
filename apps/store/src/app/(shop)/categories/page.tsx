import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { ArrowRight, FolderOpen, Package } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CategoriesPage() {
  const inStockWhere = {
    OR: [{ stock: { gt: 0 } }, { variants: { some: { stock: { gt: 0 } } } }],
  };

  let categories: {
    id: number;
    name: string;
    image: string | null;
    products: number;
    subcategories: number;
  }[] = [];

  try {
    const rows = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: {
        _count: {
          select: {
            products: { where: inStockWhere },
            subcategories: true,
          },
        },
      },
    });

    categories = rows.map((category) => ({
      id: category.id,
      name: category.name,
      image: category.image
        ? `data:image/png;base64,${Buffer.from(category.image).toString("base64")}`
        : null,
      products: category._count.products,
      subcategories: category._count.subcategories,
    }));
  } catch (error) {
    console.error("FETCH CATEGORIES PAGE ERROR:", error);
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10 mt-5 sm:px-6 lg:px-8">
      <header className="mb-10 max-w-2xl">
        <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-fuchsia-200 bg-fuchsia-50 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-fuchsia-600 dark:border-fuchsia-800 dark:bg-fuchsia-950 dark:text-fuchsia-400">
          <FolderOpen className="h-3 w-3" />
          Categories
        </div>
        <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
          Shop by category
        </h1>
        <p className="mt-2 text-sm text-muted-foreground sm:text-base">
          Browse all categories and jump straight to the products you want.
        </p>
      </header>

      {categories.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed py-20 text-center">
          <FolderOpen className="mb-3 h-10 w-10 text-muted-foreground/50" />
          <p className="font-medium">No categories available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon as new collections are added.
          </p>
          <Link
            href="/products"
            className="mt-5 text-sm font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-400"
          >
            Browse all products
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categories.map((category) => (
            <Link
              key={category.id}
              href={`/products?categoryId=${category.id}`}
              className="group overflow-hidden rounded-xl border bg-white shadow-sm transition-all hover:-translate-y-1 hover:shadow-lg dark:bg-zinc-900"
            >
              <div className="relative h-40 overflow-hidden bg-gradient-to-br from-fuchsia-100 via-fuchsia-50 to-white dark:from-fuchsia-950 dark:via-zinc-900 dark:to-zinc-900">
                {category.image ? (
                  <img
                    src={category.image}
                    alt={category.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-fuchsia-400 dark:text-fuchsia-700">
                    <Package className="h-12 w-12" />
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/35 to-transparent" />
              </div>

              <div className="p-4">
                <h2 className="truncate text-lg font-semibold group-hover:text-fuchsia-600 dark:group-hover:text-fuchsia-400">
                  {category.name}
                </h2>
                <div className="mt-2 flex items-center justify-between text-sm text-muted-foreground">
                  <span>
                    {category.products} product{category.products === 1 ? "" : "s"}
                    {category.subcategories > 0
                      ? ` · ${category.subcategories} subcategor${category.subcategories === 1 ? "y" : "ies"}`
                      : ""}
                  </span>
                  <span className="inline-flex items-center gap-1 font-medium text-fuchsia-600 dark:text-fuchsia-400">
                    Shop
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