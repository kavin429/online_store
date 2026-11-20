"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "./product-card";

interface Product {
  id: number;
  name: string;
  description?: string;
  sellingPrice: number;
  costPrice: number;
  featured: boolean;
  createdAt?: string;
  stock?: number;
  images: { id: number; url: string }[];
  category: { id: number; name: string };
  vendor?: {
    id: number;
    name: string;
    vendorSettings?: { storeName?: string | null } | null;
  } | null;
  store?: string;
  isNew?: boolean;
}

function isNewProduct(createdAt?: string) {
  if (!createdAt) return false;
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) return false;
  const days = (Date.now() - created) / (1000 * 60 * 60 * 24);
  return days <= 14;
}

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products?limit=8&sort=newest");
        const data = await res.json();
        const list: Product[] = (data.data || []).map((p: Product) => ({
          ...p,
          store:
            p.vendor?.vendorSettings?.storeName || p.vendor?.name || undefined,
          isNew: isNewProduct(p.createdAt),
        }));
        setProducts(list);
      } catch (error) {
        console.error("FETCH PRODUCTS ERROR:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  return (
    <section className="px-3 sm:px-5 lg:px-7">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Latest products
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Fresh arrivals and popular picks, ready to shop now.
          </p>
        </div>
        <Link
          href="/products"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-fuchsia-600 hover:underline dark:text-fuchsia-400"
        >
          View all products
          <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="h-72 animate-pulse rounded-xl border border-fuchsia-100 bg-fuchsia-50/50 dark:border-fuchsia-900/30 dark:bg-fuchsia-950/20"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-fuchsia-200 py-16 text-center dark:border-fuchsia-900/40">
          <p className="font-medium">No products available yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Check back soon for new arrivals.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 sm:gap-3 md:grid-cols-3 md:gap-5 lg:grid-cols-4 lg:gap-6 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product as any} />
          ))}
        </div>
      )}
    </section>
  );
}