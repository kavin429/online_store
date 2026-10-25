"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import ProductCard from "@/components/Home/product";

interface Product {
  id: number;
  name: string;
  sellingPrice: number;
  costPrice: number;
  images: { id: number; url: string }[];
  category?: { id: number; name: string };
}

export default function ProductsPage() {
  const searchParams = useSearchParams();
  const categoryId = searchParams.get("categoryId") || searchParams.get("category");

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const query = categoryId ? `?categoryId=${categoryId}` : "";
        const res = await fetch(`/api/products${query}`);
        const data = await res.json();
        setProducts(data.data || []);
      } catch (error) {
        console.error(error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, [categoryId]);

  return (
    <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <header className="mb-8">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">
          {categoryId ? "Products" : "All Products"}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Browse our latest collection
        </p>
      </header>

      {loading ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          Loading...
        </div>
      ) : products.length === 0 ? (
        <div className="flex items-center justify-center py-20 text-muted-foreground">
          No products found
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <div key={product.id}>
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
