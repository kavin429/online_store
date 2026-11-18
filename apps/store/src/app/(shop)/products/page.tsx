"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import ProductCard from "@/components/Home/product-card";

const PAGE_SIZE = 12;

interface Product {
  id: number;
  name: string;
  description?: string;
  sellingPrice: number;
  costPrice: number;
  featured: boolean;
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

function ProductsContent() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || searchParams.get("category");
  const vendorId = searchParams.get("vendorId") || searchParams.get("storeId");

  const [products, setProducts] = useState<Product[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [page, setPage] = useState(1);
  const [categoryName, setCategoryName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Start from the first page whenever the filters change.
  useEffect(() => {
    setPage(1);
  }, [categoryId, vendorId]);

  useEffect(() => {
    let cancelled = false;

    const fetchProducts = async () => {
      try {
        setLoading(true);
        setError(null);

        const params = new URLSearchParams({
          page: String(page),
          limit: String(PAGE_SIZE),
        });
        if (categoryId) params.set("categoryId", categoryId);
        if (vendorId) params.set("vendorId", vendorId);

        const res = await fetch(`/api/products?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load products");

        const data = await res.json();
        if (cancelled) return;

        const list: Product[] = (data.data || []).map((p: Product) => ({
          ...p,
          rating: Number((Math.random() * 2 + 3).toFixed(1)),
          store:
            p.vendor?.vendorSettings?.storeName ||
            p.vendor?.name ||
            undefined,
          isNew: Math.random() > 0.5,
        }));

        setProducts(list);
        setPagination(data.pagination ?? null);
        setCategoryName(list[0]?.category?.name ?? null);
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
  }, [categoryId, vendorId, page]);

  const title = categoryName ?? (categoryId ? "Products" : "All Products");
  const showPagination = pagination !== null && pagination.totalPages > 1;

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 mt-5">
      <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
            {title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {categoryId
              ? `Browse our ${categoryName ?? "selected"} collection`
              : "Browse our latest collection"}
          </p>
        </div>

        {categoryId && (
          <Link
            href="/products"
            className="inline-flex items-center gap-1.5 rounded-lg border border-fuchsia-200 px-3 py-2 text-sm font-medium text-fuchsia-700 transition hover:bg-fuchsia-50 dark:border-fuchsia-900 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950"
          >
            <X className="h-4 w-4" />
            Clear filter
          </Link>
        )}
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-20 text-rose-600">
          {error}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center gap-3 py-20 text-center text-muted-foreground">
          <p>No products found{categoryName ? ` in ${categoryName}` : ""}.</p>
          {categoryId && (
            <Link
              href="/products"
              className="text-sm font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-400"
            >
              Browse all products
            </Link>
          )}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
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
