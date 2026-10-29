"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@online-store/ui/button";
import { Card, CardContent } from "@online-store/ui/card";
import { ShoppingCart, Heart, CircleCheckIcon, Minus, Plus } from "lucide-react";
import { useCart } from "@/context/addToCard";
import { useWishlist } from "@/context/favorite";
import ProductCard from "@/components/Home/product-card";
import { useSession } from "next-auth/react";
import { toast } from "sonner";
import AuthRequiredDialog from "@/components/misc/authRequiredDialog";

interface VariantValue {
  id: number;
  variantTypeId: number;
  name: string;
  hexCode?: string | null;
  unit?: string | null;
}

interface VariantType {
  id: number;
  name: string;
  slug: string;
  variantvalue: VariantValue[];
}

interface Product {
  id: number;
  name: string;
  description?: string;
  sellingPrice: number;
  costPrice: number;
  featured: boolean;
  stock?: number;
  variants?: {
    id: number;
    stock: number;
    values: { variantValueId: number }[];
  }[];
  images: { id: number; url: string }[];
  category: { id: number; name: string };
  variantTypes?: VariantType[];
}

type TabKey = "description" | "reviews" | "comments" | "specifications";

export default function ProductDetailsPage() {
  const params = useParams();
  const id = params.id;
  const router = useRouter();
  const { addToCart, isInCart } = useCart();
  const { addToWishlist, removeFromWishlist, isInWishlist } = useWishlist();
  const [product, setProduct] = useState<Product | null>(null);

  const [selectedImage, setSelectedImage] = useState<string>("");

  // quantity
  const [quantity, setQuantity] = useState<number>(1);

  // variant selections — keyed by variantTypeId -> variantValueId
  const [selectedVariants, setSelectedVariants] = useState<Record<number, number>>({});

  // tabs
  const [activeTab, setActiveTab] = useState<TabKey>("description");

  // related products
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const { data: session } = useSession();
  const [authDialogOpen, setAuthDialogOpen] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();

        setProduct(data.data);

        if (data.data.images?.length > 0) {
          setSelectedImage(data.data.images[0].url);
        }

        // default-select the first value of each variant type
        const types: VariantType[] = data.data.variantTypes || [];
        const defaults: Record<number, number> = {};
        types.forEach((t) => {
          if (t.variantvalue?.length > 0) defaults[t.id] = t.variantvalue[0].id;
        });
        setSelectedVariants(defaults);
      } catch (error) {
        console.error(error);
      }
    };

    if (id) {
      fetchProduct();
    }
  }, [id]);

  // fetch related products from the same category
  useEffect(() => {
    if (!product?.category?.id) return;

    const fetchRelated = async () => {
      try {
        const res = await fetch(
          `/api/products?categoryId=${product.category.id}`
        );
        const data = await res.json();
        const list: Product[] = data.data || [];
        setRelatedProducts(list.filter((p) => p.id !== product.id));
      } catch (error) {
        console.error(error);
      }
    };

    fetchRelated();
  }, [product?.category?.id, product?.id]);

  const findSelectedVariant = (p: Product) => {
    const selectedIds = Object.values(selectedVariants);
    if (selectedIds.length === 0) return null;

    return (
      (p.variants ?? []).find((variant) => {
        const ids = variant.values?.map((value) => value.variantValueId) ?? [];
        return (
          selectedIds.every((id) => ids.includes(id)) &&
          ids.every((id) => selectedIds.includes(id))
        );
      }) ?? null
    );
  };

  const getAvailableStock = (p: Product) => {
    const variant = findSelectedVariant(p);
    return Math.max(0, variant ? variant.stock : p.stock ?? 0);
  };

  const availableStock = product ? getAvailableStock(product) : 0;

  // Keep the quantity inside the currently available stock (e.g. when the
  // shopper switches to a variant with fewer units left).
  useEffect(() => {
    setQuantity((q) => Math.max(1, Math.min(q, availableStock)));
  }, [availableStock]);

  const requireAuth = (action: () => void) => {
    if (!session) {
      setAuthDialogOpen(true);
      return;
    }
    action();
  };

  const handleAddToCart = (p: Product) => {
    requireAuth(() => {
      const stock = getAvailableStock(p);

      if (stock <= 0) {
        toast.error("This product is out of stock");
        return;
      }

      const variant = findSelectedVariant(p);
      const result = addToCart({
        ...p,
        quantity: Math.min(quantity, stock),
        stock,
        variantId: variant?.id ?? null,
        selectedVariants,
      });

      if (!result.ok) {
        toast.error(result.message ?? "Could not add to cart");
      } else if (result.message) {
        toast.warning(result.message);
      } else {
        toast.success("Added to cart");
      }
    });
  };

  const handleWishlistToggle = (p: Product) => {
    requireAuth(() => {
      if (isInWishlist(p.id)) {
        removeFromWishlist(p.id);
      } else {
        addToWishlist(p);
      }
    });
  };

  const decreaseQuantity = () => setQuantity((q) => Math.max(1, q - 1));
  const increaseQuantity = () =>
    setQuantity((q) => Math.min(Math.max(1, availableStock), q + 1));

  const selectVariantValue = (variantTypeId: number, variantValueId: number) => {
    setSelectedVariants((prev) => ({ ...prev, [variantTypeId]: variantValueId }));
  };

  const tabs: { key: TabKey; label: string }[] = [
    { key: "description", label: "Description" },
    { key: "reviews", label: "Reviews" },
    { key: "comments", label: "Comments" },
    { key: "specifications", label: "Specifications" },
  ];

  if (!product) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading...
      </div>
    );
  }

  const variantTypes = product.variantTypes || [];
  const inCart = isInCart(product.id);
  const outOfStock = availableStock <= 0;

  return (
    <div className="max-w-7xl mx-auto p-5 my-20">
      <Card className="border-none shadow-none">
        <CardContent className="grid lg:grid-cols-2 gap-20 p-0">
          {/* LEFT SIDE */}
          <div className="flex gap-10">
            {/* Thumbnail Images */}
            {product.images?.length > 1 && (
              <div className="flex flex-col gap-3 overflow-y-auto max-h-[400px]">
                {product.images.map((img) => (
                  <button
                    key={img.id}
                    onClick={() => setSelectedImage(img.url)}
                    className={`
                      w-[90px] h-[90px]
                      border-2 rounded-lg overflow-hidden
                      flex-shrink-0 bg-white
                      transition-all
                      ${selectedImage === img.url ? "border-black" : "border-zinc-200"}
                    `}
                  >
                    <img
                      src={img.url}
                      alt="product"
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Image */}
            <Card className="flex-1 overflow-hidden p-0">
              <div className="bg-zinc-100 w-full h-[400px]">
                <img
                  src={selectedImage || "/placeholder.png"}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
            </Card>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex flex-col gap-5">
            <div>
              <span className="text-xs uppercase bg-fuchsia-100/90 dark:bg-fuchsia-100/10 p-1 rounded-md">
                {product.category?.name}
              </span>
              <h1 className="text-xl font-bold leading-tight">
                {product.name}
              </h1>
              <p className="text-zinc-400 dark:text-zinc-500 text-sm">
                {product.description || "No description available"}
              </p>
            </div>

            {/* Variant options — only shows sections that actually have values */}
            {variantTypes
              .filter((type) => type.variantvalue && type.variantvalue.length > 0)
              .map((type) => {
                const isColorType =
                  type.slug?.toLowerCase() === "color" ||
                  type.name?.toLowerCase() === "color";

                return (
                  <div key={type.id} className="flex flex-col gap-2">
                    <span className="text-xs text-zinc-600 dark:text-zinc-500">
                      {type.name.toUpperCase()}
                    </span>

                    <div className="flex items-center gap-3 flex-wrap">
                      {type.variantvalue.map((value) => {
                        const isSelected = selectedVariants[type.id] === value.id;

                        if (isColorType || value.hexCode) {
                          return (
                            <button
                              key={value.id}
                              onClick={() => selectVariantValue(type.id, value.id)}
                              title={value.name}
                              className={`w-6 h-6 rounded-md border-2 transition-all ${isSelected ? "border-black scale-110" : "border-zinc-200"
                                }`}
                              style={{ backgroundColor: value.hexCode || "#ccc" }}
                            />
                          );
                        }

                        return (
                          <button
                            key={value.id}
                            onClick={() => selectVariantValue(type.id, value.id)}
                            className={`px-4 py-1.5 rounded-lg border text-sm transition-all ${isSelected
                                ? "border-black bg-black text-white"
                                : "border-zinc-200 text-zinc-600 hover:border-zinc-400"
                              }`}
                          >
                            {value.name}
                            {value.unit ? ` ${value.unit}` : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}

            {/* Price */}
            <div className="flex items-center gap-4">
              <p className="text-2xl text-zinc-400 line-through">
                LKR {product.costPrice}
              </p>
              <p className="text-4xl font-bold">LKR {product.sellingPrice}</p>
            </div>

            {/* Live stock */}
            {outOfStock ? (
              <p className="text-sm font-semibold text-red-500">
                Out of stock — check back after it is restocked
              </p>
            ) : availableStock <= 5 ? (
              <p className="text-sm font-medium text-amber-600 dark:text-amber-400">
                Only {availableStock} left in stock
              </p>
            ) : (
              <p className="text-sm text-zinc-500 dark:text-zinc-400">
                {availableStock} in stock
              </p>
            )}

            {/* Buttons */}
            <div className="flex flex-wrap gap-4 pt-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center border border-zinc-200 dark:border-zinc-800 rounded-md w-fit">
                  <Button
                    onClick={decreaseQuantity}
                    disabled={quantity <= 1 || outOfStock}
                    className="rounded-r-none"
                    variant="shoesecondary"
                    size="sm"
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-10 text-center text-sm font-semibold">
                    {quantity}
                  </span>
                  <Button
                    onClick={increaseQuantity}
                    disabled={outOfStock || quantity >= availableStock}
                    variant="shoesecondary"
                    className="rounded-l-none"
                    size="sm"
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <Button
                size="sm"
                variant="shoe"
                onClick={() => handleAddToCart(product)}
                disabled={inCart || outOfStock}
              >
                <ShoppingCart className="mr-2 h-4 w-4" />
                {outOfStock ? "Out of Stock" : inCart ? "In Cart" : "Add To Cart"}
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleWishlistToggle(product)}
              >
                <Heart
                  className={`h-4 w-4 cursor-pointer transition-colors ${isInWishlist(product.id)
                      ? "fill-red-500 text-red-500"
                      : "text-zinc-500 hover:text-red-500"
                    }`}
                />
                <p className="px-2">Wishlist</p>
              </Button>
            </div>

            {/* Extra Info */}
            <div className="border-t pt-5 mt-5 space-y-2 text-sm text-zinc-600">
              <div className="flex gap-2">
                <CircleCheckIcon className="h-5 w-5" />
                <p>Free delivery available</p>
              </div>
              <div className="flex gap-2">
                <CircleCheckIcon className="h-5 w-5" />
                <p>Secure payment options</p>
              </div>
              <div className="flex gap-2">
                <CircleCheckIcon className="h-5 w-5" />
                <p>Easy return policy</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* TABS */}
      <div className="mt-16">
        <div className="flex gap-8 border-b border-zinc-200 dark:border-zinc-800">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`pb-3 text-sm font-medium transition-colors relative ${activeTab === tab.key
                ? "text-black dark:text-white"
                : "text-zinc-400 hover:text-zinc-600"
                }`}
            >
              {tab.label}
              {activeTab === tab.key && (
                <span className="absolute left-0 -bottom-[1px] w-full h-[2px] bg-black dark:bg-white rounded-full" />
              )}
            </button>
          ))}
        </div>

        <div className="py-8 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {activeTab === "description" && (
            <p>{product.description || "No description available."}</p>
          )}

          {activeTab === "reviews" && (
            <div className="flex flex-col gap-4">
              <p className="text-zinc-400">No reviews yet. Be the first to review this product.</p>
            </div>
          )}

          {activeTab === "comments" && (
            <div className="flex flex-col gap-4">
              <p className="text-zinc-400">No comments yet.</p>
            </div>
          )}

          {activeTab === "specifications" && (
            <table className="w-full text-left border-collapse">
              <tbody>
                <tr className="border-b border-zinc-100 dark:border-zinc-900">
                  <td className="py-2 pr-4 font-medium text-zinc-800 dark:text-zinc-300 w-40">
                    Category
                  </td>
                  <td className="py-2 text-zinc-700 dark:text-zinc-400">
                    {product.category?.name}
                  </td>
                </tr>
                {variantTypes.map((type) => (
                  <tr key={type.id} className="border-b border-zinc-100 dark:border-zinc-900">
                    <td className="py-2 pr-4 font-medium text-zinc-800">
                      {type.name}
                    </td>
                    <td className="py-2 text-zinc-500">
                      {type.variantvalue.map((v) => v.name).join(", ")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div className="mt-16">
          <h2 className="text-xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {relatedProducts.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>
      )}

      {/* AUTH REQUIRED DIALOG */}
      <AuthRequiredDialog
        open={authDialogOpen}
        onOpenChange={setAuthDialogOpen}
        redirectTo={`/products/${id}`}
      />
    </div>
  );
}