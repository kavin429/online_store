"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, Search, SlidersHorizontal, X } from "lucide-react";
import ProductCard from "@/components/Home/product-card";
import { Button } from "@online-store/ui/button";

const PAGE_SIZE = 12;

interface Product {
  id: number;
  name: string;
  description?: string;
  sellingPrice: number;
  costPrice: number;
  featured: boolean;
  createdAt?: string;
  images: { id: number; url: string }[];
  category: { id: number; name: string };
  vendor?: {
    id: number;
    name: string;
    vendorSettings?: { storeName?: string | null } | null;
  } | null;
  rating?: number;
  store?: string;
  isNew?: boolean;
}

interface Pagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

function isNewProduct(createdAt?: string) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

function ProductsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const q = (searchParams.get("q") || "").trim();
  const categoryId = searchParams.get("categoryId") || searchParams.get("category");
  const vendorId = searchParams.get("vendorId") || searchParams.get("storeId");
  const sort = searchParams.get("sort") || "newest";

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState(q);

  useEffect(() => {
    setSearchInput(q);
  }, [q]);

  // Start from the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [q, categoryId, vendorId, sort]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
          sort,
        });
        if (q) params.set("q", q);
        if (categoryId) params.set("categoryId", categoryId);
        if (vendorId) params.set("vendorId", vendorId);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load products");

        const data = await res.json();
        if (cancelled) return;

        const list: Product[] = (data.data || []).map((p: Product) => ({
          ...p,
          store:
            p.vendor?.vendorSettings?.storeName ||
            p.vendor?.name ||
            undefined,
          isNew: isNewProduct(p.createdAt),
        }));

        setProducts(list);
        setPagination(data.pagination ?? null);
        const match = categoryId
          ? list.find((p) => String(p.category?.id) === String(categoryId))
          : null;
        setCategoryName(match?.category?.name ?? (categoryId ? null : null));
      } catch (err) {
        if (cancelled) return;
        console.error(err);
        setProducts([]);
        setPagination(null);
        setCategoryName(null);
        setError("Could not load products. Please try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProducts();

    return () => {
      cancelled = true;
    };
  }, [q, categoryId, vendorId, sort, page]);

  const hasFilters = Boolean(q || categoryId || vendorId);
  const title = q
    ? `Search results for "${q}"`
    : categoryName ?? (categoryId ? "Category" : "All Products");
  const showPagination = pagination !== null && pagination.totalPages > 1;

  const updateParams = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    Object.entries(updates).forEach(([key, value]) => {
      if (value === null || value === "") params.delete(key);
      else params.set(key, value);
    });
    const qs = params.toString();
    router.push(qs ? `/products?${qs}` : "/products");
  };

  const submitSearch = (e: React.FormEvent) => {
    e.preventDefault();
    updateParams({ q: searchInput.trim() || null });
  };

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-5">
      <header className="mb-8 space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
              {title}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {loading
                ? "Finding products..."
                : q
                  ? `${pagination?.total ?? 0} result${(pagination?.total ?? 0) === 1 ? "" : "s"} found`
                  : categoryId
                    ? `Browse our ${categoryName ?? "selected"} collection`
                    : "Browse our latest collection"}
            </p>
          </div>

          {hasFilters && (
            <Link
              href="/products"
              className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-200 px-3 py-2 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-900 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950"
            >
              <X className="h-4 w-4" />
              Clear all
            </Link>
          )}
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-fuchsia-100 bg-white/70 p-3 dark:border-fuchsia-900/40 dark:bg-zinc-950/40">
          <form onSubmit={submitSearch} className="relative w-full sm:max-w-md">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products, categories, or stores"
              className="w-full rounded-lg border border-fuchsia-200 bg-white py-2.5 pl-9 pr-24 text-sm outline-none ring-fuchsia-400 focus:ring-2 dark:border-fuchsia-900 dark:bg-zinc-950"
            />
            <Button
              type="submit"
              size="sm"
              variant="shoe"
              className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 px-3"
            >
              Search
            </Button>
          </form>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-gray-400" />
            <label htmlFor="sort" className="text-sm text-muted-foreground">
              Sort
            </label>
            <select
              id="sort"
              value={sort}
              onChange={(e) => updateParams({ sort: e.target.value })}
              className="rounded-lg border border-fuchsia-200 bg-white px-3 py-2 text-sm outline-none ring-fuchsia-400 focus:ring-2 dark:border-fuchsia-900 dark:bg-zinc-950"
            >
              <option value="newest">Newest</option>
              <option value="price_asc">Price: Low to High</option>
              <option value="price_desc">Price: High to Low</option>
              <option value="name_asc">Name: A to Z</option>
            </select>
          </div>
        </div>

        {hasFilters && (
          <div className="flex flex-wrap items-center gap-2">
            {q && (
              <button
                type="button"
                onClick={() => updateParams({ q: null })}
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300"
              >
                Search: {q} <X className="h-3 w-3" />
              </button>
            )}
            {categoryId && (
              <button
                type="button"
                onClick={() => updateParams({ categoryId: null, category: null })}
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300"
              >
                Category filter <X className="h-3 w-3" />
              </button>
            )}
            {vendorId && (
              <button
                type="button"
                onClick={() => updateParams({ vendorId: null, storeId: null })}
                className="inline-flex items-center gap-1 rounded-full bg-fuchsia-50 px-3 py-1 text-xs font-medium text-fuchsia-700 dark:bg-fuchsia-950 dark:text-fuchsia-300"
              >
                Store filter <X className="h-3 w-3" />
              </button>
            )}
          </div>
        )}
      </header>

      {loading ? (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-80 animate-pulse rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20"
            />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center">
          <p className="text-rose-600">{error}</p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Try again
          </Button>
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-fuchsia-200 py-20 text-center dark:border-fuchsia-900/40">
          <p className="text-lg font-medium">No products found</p>
          <p className="max-w-md text-sm text-muted-foreground">
            {q
              ? `We couldn't find anything matching "${q}". Try different keywords or clear your filters.`
              : categoryName
                ? `No products are available in ${categoryName} right now.`
                : "No products are available right now."}
          </p>
          {hasFilters && (
            <Link
              href="/products"
              className="mt-2 text-sm font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-400"
            >
              Browse all products
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <div key={product.id}>
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {showPagination && pagination && (
            <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-fuchsia-100 pt-6 dark:border-fuchsia-900/40">
              <p className="text-sm text-muted-foreground">
                Page {pagination.page} of {pagination.totalPages} ·{" "}
                {pagination.total} product{pagination.total !== 1 ? "s" : ""}
              </p>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={pagination.page <= 1}
                  className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-200 px-3 py-2 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-fuchsia-900 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950"
                >
                  <ChevronLeft className="h-4 w-4" />
                  Previous
                </button>
                <button
                  type="button"
                  onClick={() => setPage((p) => p + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="inline-flex items-center gap-1 rounded-lg border border-fuchsia-200 px-3 py-2 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-fuchsia-900 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950"
                >
                  Next
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </main>
  );
}

export default function ProductsPage() {
  return (
    <Suspense>
      <ProductsContent />
    </Suspense>
  );
}
