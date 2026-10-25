"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { ArrowLeft } from "lucide-react";

type AttributeValue = {
  id: number;
  name: string;
  hexCode: string | null;
  unit: string | null;
};

type Variant = {
  id: number;
  sku: string | null;
  priceOverride: number | null;
  stock: number | null;
  image: string | null;
  attributes: Record<string, AttributeValue>;
};

type ProductDetail = {
  id: number;
  name: string;
  description?: string | null;
  createdAt: string;
  costPrice?: number | null;
  sellingPrice?: number | null;
  stock?: number | null;
  featured?: boolean;
  category?: { id: number; name: string };
  images?: { id: number; url: string }[];
  variants?: Variant[];
};

export default function ProductViewPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [product, setProduct] = useState<ProductDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setError("No product id provided");
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const json = await res.json();

        if (!res.ok) {
          setError(json.error || "Failed to load product");
        } else {
          setProduct(json.data);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Loading product...
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 text-center text-red-500">
        {error || "Product not found"}
      </div>
    );
  }

  const variants = product.variants || [];

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Button variant="ghost" onClick={() => router.back()} className="gap-2">
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>

      <div className="border rounded-xl p-6 space-y-6 bg-background shadow-sm">
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-bold">{product.name}</h1>
            {product.featured && (
              <span className="text-sm text-fuchsia-500 dark:text-fuchsia-400">
                Featured
              </span>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Category: {product.category?.name || "—"}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Created: {new Date(product.createdAt).toLocaleDateString()}
          </p>
        </div>

        {/* Images */}
        {product.images && product.images.length > 0 && (
          <div className="flex gap-3 flex-wrap">
            {product.images.map((img) => (
              <img
                key={img.id}
                src={img.url}
                alt={product.name}
                className="w-28 h-28 rounded-lg object-cover border"
              />
            ))}
          </div>
        )}

        {/* Description */}
        {product.description && (
          <div>
            <h2 className="font-semibold mb-1">Description</h2>
            <p className="text-sm text-muted-foreground">{product.description}</p>
          </div>
        )}

        {/* Price & stock */}
        <div className="grid grid-cols-3 gap-4">
          <div>
            <p className="text-xs text-muted-foreground">Cost Price</p>
            <p className="font-medium">LKR {product.costPrice ?? 0}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Selling Price</p>
            <p className="font-medium text-green-600">
              LKR {product.sellingPrice ?? 0}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Stock</p>
            <p className="font-medium">{product.stock ?? 0}</p>
          </div>
        </div>

        {/* Variants */}
        {variants.length > 0 && (
          <div>
            <h2 className="font-semibold mb-2">Variants</h2>
            <div className="space-y-3">
              {variants.map((variant) => (
                <div
                  key={variant.id}
                  className="flex items-center gap-3 p-3 rounded-lg border bg-muted"
                >
                  {variant.image && (
                    <img
                      src={variant.image}
                      alt="variant"
                      className="w-12 h-12 rounded-md object-cover border"
                    />
                  )}
                  <div className="flex flex-wrap gap-2 flex-1">
                    {Object.entries(variant.attributes).map(([slug, attr]) => (
                      <div key={slug} className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground capitalize">{slug}:</span>
                        {attr.hexCode && (
                          <span
                            className="w-3 h-3 rounded-full border inline-block"
                            style={{ backgroundColor: attr.hexCode }}
                          />
                        )}
                        <span className="text-xs font-medium">
                          {attr.name}{attr.unit ? ` ${attr.unit}` : ""}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-4 text-xs text-right shrink-0">
                    {variant.sku && (
                      <span className="text-muted-foreground">SKU: {variant.sku}</span>
                    )}
                    {variant.priceOverride != null && (
                      <span className="text-green-600">LKR {variant.priceOverride}</span>
                    )}
                    {variant.stock != null && (
                      <span className="text-muted-foreground">{variant.stock} in stock</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}