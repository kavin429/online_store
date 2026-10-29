"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@online-store/ui/card";
import { Star, Heart } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import { useCart } from "@/context/addToCard";
import { useWishlist } from "@/context/favorite";
import AuthRequiredDialog from "@/components/misc/authRequiredDialog";
import { Button } from "@online-store/ui/button";

interface Product {
  id: number;
  name: string;
  description?: string;
  sellingPrice: number;
  costPrice: number;
  featured: boolean;
  stock?: number;
  images: {
    id: number;
    url: string;
  }[];
  category: {
    id: number;
    name: string;
  };
  rating?: number;
  store?: string;
  isNew?: boolean;
}

export default function ProductCard() {
  const router = useRouter();
  const { data: session } = useSession();
  const [products, setProducts] = useState<Product[]>([]);
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();

        const productsWithExtras = data.data.map((product: Product) => ({
          ...product,
          rating: Number((Math.random() * 2 + 3).toFixed(1)),
          store: [
            "Nike Store",
            "Fashion Hub",
            "Sneaker World",
            "Urban Feet",
            "Shoe Palace",
          ][Math.floor(Math.random() * 5)],
          isNew: Math.random() > 0.5,
        }));

        setProducts(productsWithExtras);
      } catch (error) {
        console.error("FETCH PRODUCTS ERROR:", error);
      }
    };

    fetchProducts();
  }, []);

  const formatLKR = (value: number) =>
    new Intl.NumberFormat("en-LK", {
      style: "currency",
      currency: "LKR",
    }).format(value);

  const handleBuyNow = (product: Product) => {
    router.push(`/buy-now?productId=${product.id}`);
  };

  // Gate any auth-required action behind a session check
  const requireAuth = (action: () => void) => {
    if (!session) {
      setAuthDialogOpen(true);
      return;
    }
    action();
  };

  const handleAddToCart = (product: Product) => {
    requireAuth(() => {
      const result = addToCart(product);
      if (!result.ok) {
        toast.error(result.message ?? "Could not add to cart");
      } else if (result.message) {
        toast.warning(result.message);
      }
    });
  };

  const handleWishlistToggle = (product: Product) => {
    requireAuth(() =>
      isInWishlist(product.id)
        ? removeFromWishlist(product.id)
        : addToWishlist(product)
    );
  };

  return (
    <>
      <div className="grid grid-cols-2 xs:grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-3 md:gap-5 lg:gap-6 xl:gap-8 p-3 sm:p-5 lg:p-7">
        {products.map((product) => (
          <Card
            key={product.id}
            className="flex flex-col h-full overflow-hidden border-0 shadow-xl shadow-black/10 p-0 bg-white dark:bg-zinc-900"
          >
            <div className="flex flex-row flex-1">
              <div className="w-3 sm:w-4 shrink-0 bg-fuchsia-100/90 dark:bg-fuchsia-900/20 flex items-center justify-center">
                <span className="[writing-mode:vertical-rl] rotate-180 text-[8px] sm:text-[10px] font-bold tracking-[0.1em] sm:tracking-[0.15em] uppercase whitespace-nowrap">
                  {product.category?.name || "Shop"}
                </span>
              </div>

              {/* Right column: image + details */}
              <div className="flex flex-col flex-1 min-w-0">
                {/* Image panel — image fully covers the header, edge-to-edge */}
                <Link href={`/products/${product.id}`} className="block">
                  <div className="relative w-full aspect-square sm:aspect-[4/3] overflow-hidden bg-stone-900">
                    <img
                      src={product.images?.[0]?.url || "/placeholder.png"}
                      alt={product.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* subtle top scrim so badges stay legible over any photo */}
                    <div className="absolute inset-x-0 top-0 h-16 bg-gradient-to-b from-black/40 to-transparent pointer-events-none" />

                    <div className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex items-center gap-1.5 sm:gap-2">
                      {product.isNew && (
                        <span className="bg-white/90 text-amber-900 text-[8px] sm:text-[10px] font-bold uppercase tracking-wide px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-full shadow">
                          New
                        </span>
                      )}
                      <Heart
                        onClick={(e: React.MouseEvent) => {
                          e.preventDefault();
                          handleWishlistToggle(product);
                        }}
                        className={`h-5 w-5 sm:h-6 sm:w-6 cursor-pointer transition-colors drop-shadow
                          ${
                            isInWishlist(product.id)
                              ? "fill-red-500 text-red-500"
                              : "text-white/90 hover:text-red-400"
                          }`}
                      />
                    </div>
                  </div>
                
                <div className="flex flex-col items-center text-center px-2.5 sm:px-4 pt-3 sm:pt-5 pb-3 sm:pb-4 flex-1">
                  <h3 className="text-sm sm:text-base font-bold uppercase tracking-wide text-zinc-900 dark:text-zinc-100 line-clamp-1 w-full">
                    {product.name}
                  </h3>
                  <p className="mt-1 text-[11px] sm:text-xs text-zinc-400 dark:text-zinc-500 line-clamp-2 min-h-[1.75rem] sm:min-h-[2rem] w-full">
                    {product.description ||
                      "Lorem ipsum dolor sit amet, consectetur adipis."}
                  </p>

                  <div className="flex items-center gap-1 mt-2 sm:mt-3">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-2.5 h-2.5 sm:w-3 sm:h-3 ${
                          i < Math.floor(product.rating || 0)
                            ? "fill-amber-400 text-amber-400"
                            : "fill-zinc-200 text-zinc-200 dark:fill-zinc-700 dark:text-zinc-700"
                        }`}
                      />
                    ))}
                  </div>

                  <div className="mt-1.5 sm:mt-2 flex items-baseline gap-1.5 sm:gap-2 flex-wrap justify-center">
                    <p className="text-lg sm:text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                      {formatLKR(product.sellingPrice)}
                    </p>
                    {product.costPrice > product.sellingPrice && (
                      <p className="text-[10px] sm:text-xs font-semibold text-zinc-400 line-through">
                        {formatLKR(product.costPrice)}
                      </p>
                    )}
                  </div>
                </div>
                </Link>
              </div>
            </div>

            {/* Add to cart bar — spans the full card width, under the label too */}
            <Button
              onClick={() => handleAddToCart(product)}
              disabled={isInCart(product.id) || (product.stock ?? 1) <= 0}
              variant="shoe"
              className="w-full rounded-none text-[11px] sm:text-xs md:text-sm py-1.5 sm:py-2 md:py-2.5"
            >
              {product.stock !== undefined && product.stock <= 0
                ? "Out of Stock"
                : isInCart(product.id)
                  ? "In Cart"
                  : "Add to Cart"}
            </Button>
          </Card>
        ))}
      </div>

      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
      />
    </>
  );
}