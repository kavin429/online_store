"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/addToCard";
import { formatLKR } from "@/lib/utils";
import { Button } from "@online-store/ui/button";
import { Input } from "@online-store/ui/input";
import { Card } from "@online-store/ui/card";
import { ArrowLeft, ShoppingCart, MapPin, CreditCard, Truck, Tag, X } from "lucide-react";

type FormData = {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  postalCode: string;
  paymentMethod: "cod" | "card";
};

const emptyForm: FormData = {
  fullName: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  postalCode: "",
  paymentMethod: "cod",
};

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, clearCart } = useCart();

  const [isPlacing, setIsPlacing] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [orderError, setOrderError] = useState("");
  const [errors, setErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [form, setForm] = useState<FormData>(emptyForm);

  const [promoInput, setPromoInput] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<{
    code: string;
    discountAmount: number;
    description?: string | null;
  } | null>(null);
  const [promoError, setPromoError] = useState("");
  const [applyingPromo, setApplyingPromo] = useState(false);

  const subtotal = cart.reduce(
    (sum, item) => sum + item.sellingPrice * item.quantity,
    0
  );
  const shipping = cart.length > 0 ? 350 : 0;
  const discount = appliedPromo?.discountAmount ?? 0;
  const total = Math.max(0, subtotal + shipping - discount);

  // Autofill from the logged-in user's saved profile — still fully editable after this
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/user/me");
        const data = await res.json();

        if (data.user) {
          setForm((prev) => ({
            ...prev,
            fullName: data.user.name || "",
            email: data.user.email || "",
            phone: data.user.phone || "",
            address: data.user.address || "",
            city: data.user.city || "",
            // postalCode isn't stored on the profile, left blank for the user to fill in
          }));
        }
      } catch (err) {
        console.error("Failed to load profile", err);
      } finally {
        setLoadingProfile(false);
      }
    }
    loadProfile();
  }, []);

  const handleChange = (field: keyof FormData, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next: Partial<Record<keyof FormData, string>> = {};
    if (!form.fullName.trim()) next.fullName = "Full name is required";
    if (!form.email.trim()) next.email = "Email is required";
    else if (!/^\S+@\S+\.\S+$/.test(form.email)) next.email = "Enter a valid email";
    if (!form.phone.trim()) next.phone = "Phone number is required";
    if (!form.address.trim()) next.address = "Address is required";
    if (!form.city.trim()) next.city = "City is required";
    if (!form.postalCode.trim()) next.postalCode = "Postal code is required";
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleApplyPromo = async () => {
    const code = promoInput.trim();
    if (!code) {
      setPromoError("Enter a promo code.");
      return;
    }

    setApplyingPromo(true);
    setPromoError("");
    try {
      const res = await fetch("/api/promos/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      });
      const data = await res.json();

      if (!res.ok || !data.valid) {
        setAppliedPromo(null);
        setPromoError(data.error || "Invalid promo code.");
        return;
      }

      setAppliedPromo({
        code: data.code,
        discountAmount: data.discountAmount,
        description: data.description,
      });
      setPromoInput(data.code);
    } catch (err) {
      console.error("APPLY PROMO ERROR:", err);
      setPromoError("Could not apply promo code. Please try again.");
    } finally {
      setApplyingPromo(false);
    }
  };

  const handleRemovePromo = () => {
    setAppliedPromo(null);
    setPromoInput("");
    setPromoError("");
  };

  const handlePlaceOrder = async () => {
    if (!validate()) return;

    setIsPlacing(true);
    setOrderError("");
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          items: cart,
          subtotal,
          shipping,
          promoCode: appliedPromo?.code ?? "",
          discountAmount: discount,
          total,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        console.error("ORDER ERROR:", data.error);
        setOrderError(data.error || "Failed to place order");
        return;
      }

      clearCart();
      router.push("/order-success");
    } catch (err) {
      console.error("ORDER PLACEMENT ERROR:", err);
      setOrderError("Failed to place order. Please try again.");
    } finally {
      setIsPlacing(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-24 text-center">
        <ShoppingCart className="h-16 w-16 mx-auto text-gray-300 dark:text-gray-700 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Your cart is empty
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mb-6">
          Add something to your cart before checking out.
        </p>
        <Link href="/">
          <Button variant="shoe">Continue Shopping</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <Link
        href="/cart"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-fuchsia-600 dark:hover:text-fuchsia-400 mb-6 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Cart
      </Link>

      <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-8">
        Checkout
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: forms */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="p-6 border border-fuchsia-100 dark:border-fuchsia-900/40">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="h-4 w-4 text-fuchsia-500" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Shipping Details
              </h2>
              {loadingProfile && (
                <span className="text-xs text-gray-400 ml-2">Loading your details...</span>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Full Name
                </label>
                <Input
                  value={form.fullName}
                  onChange={(e) => handleChange("fullName", e.target.value)}
                  placeholder="John Doe"
                  className="rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                />
                {errors.fullName && (
                  <p className="text-xs text-red-500 mt-1">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Email
                </label>
                <Input
                  type="email"
                  value={form.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  placeholder="john@example.com"
                  className="rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Phone
                </label>
                <Input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  placeholder="077 123 4567"
                  className="rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                />
                {errors.phone && (
                  <p className="text-xs text-red-500 mt-1">{errors.phone}</p>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Address
                </label>
                <Input
                  value={form.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  placeholder="123 Main Street"
                  className="rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                />
                {errors.address && (
                  <p className="text-xs text-red-500 mt-1">{errors.address}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  City
                </label>
                <Input
                  value={form.city}
                  onChange={(e) => handleChange("city", e.target.value)}
                  placeholder="Colombo"
                  className="rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                />
                {errors.city && (
                  <p className="text-xs text-red-500 mt-1">{errors.city}</p>
                )}
              </div>

              <div>
                <label className="text-sm text-gray-600 dark:text-gray-400 mb-1 block">
                  Postal Code
                </label>
                <Input
                  value={form.postalCode}
                  onChange={(e) => handleChange("postalCode", e.target.value)}
                  placeholder="00100"
                  className="rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                />
                {errors.postalCode && (
                  <p className="text-xs text-red-500 mt-1">{errors.postalCode}</p>
                )}
              </div>
            </div>
          </Card>

          <Card className="p-6 border border-fuchsia-100 dark:border-fuchsia-900/40">
            <div className="flex items-center gap-2 mb-4">
              <CreditCard className="h-4 w-4 text-fuchsia-500" />
              <h2 className="font-semibold text-gray-900 dark:text-gray-100">
                Payment Method
              </h2>
            </div>

            <div className="space-y-2">
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.paymentMethod === "cod"
                    ? "border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40"
                    : "border-fuchsia-100 dark:border-fuchsia-900/40"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={form.paymentMethod === "cod"}
                  onChange={() => handleChange("paymentMethod", "cod")}
                  className="accent-fuchsia-500"
                />
                <Truck className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Cash on Delivery
                  </p>
                  <p className="text-xs text-gray-400">Pay when your order arrives</p>
                </div>
              </label>

              <label
                className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  form.paymentMethod === "card"
                    ? "border-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40"
                    : "border-fuchsia-100 dark:border-fuchsia-900/40"
                }`}
              >
                <input
                  type="radio"
                  name="paymentMethod"
                  checked={form.paymentMethod === "card"}
                  onChange={() => handleChange("paymentMethod", "card")}
                  className="accent-fuchsia-500"
                />
                <CreditCard className="h-4 w-4 text-gray-500" />
                <div>
                  <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    Card Payment
                  </p>
                  <p className="text-xs text-gray-400">Visa, Mastercard, and more</p>
                </div>
              </label>
            </div>
          </Card>
        </div>

        {/* Right: order summary */}
        <div className="lg:col-span-1">
          <Card className="p-6 border border-fuchsia-100 dark:border-fuchsia-900/40 sticky top-24">
            <h2 className="font-semibold text-lg text-gray-900 dark:text-gray-100 mb-4">
              Order Summary
            </h2>

            <div className="max-h-60 overflow-y-auto space-y-3 mb-4 pr-1">
              {cart.map((item) => (
                <div key={item.id} className="flex items-center gap-3">
                  <img
                    src={item.images?.[0]?.url || "/placeholder.png"}
                    alt={item.name}
                    className="w-12 h-12 object-cover rounded-md border border-fuchsia-50 dark:border-zinc-800 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {item.name}
                    </p>
                    <p className="text-xs text-gray-400">Qty {item.quantity}</p>
                  </div>
                  <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 shrink-0">
                    {formatLKR(item.sellingPrice * item.quantity)}
                  </p>
                </div>
              ))}
            </div>

            <div className="space-y-2 text-sm border-t border-fuchsia-100 dark:border-zinc-800 pt-4">
              {appliedPromo ? (
                <div className="flex items-center justify-between gap-2 rounded-lg bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-900/50 px-3 py-2">
                  <span className="inline-flex items-center gap-2 text-green-700 dark:text-green-400 font-medium">
                    <Tag className="h-3.5 w-3.5" />
                    {appliedPromo.code}
                  </span>
                  <button
                    type="button"
                    onClick={handleRemovePromo}
                    className="text-gray-400 hover:text-red-500 transition-colors"
                    aria-label="Remove promo code"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <>
                  <div className="flex gap-2">
                    <Input
                      value={promoInput}
                      onChange={(e) => {
                        setPromoInput(e.target.value.toUpperCase());
                        if (promoError) setPromoError("");
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleApplyPromo();
                        }
                      }}
                      placeholder="Promo code"
                      className="h-9 rounded-lg border-fuchsia-200 dark:border-fuchsia-900 focus-visible:ring-fuchsia-400"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleApplyPromo}
                      disabled={applyingPromo || !promoInput.trim()}
                    >
                      {applyingPromo ? "..." : "Apply"}
                    </Button>
                  </div>
                  {promoError && (
                    <p className="text-xs text-red-500">{promoError}</p>
                  )}
                </>
              )}

              <div className="flex justify-between text-gray-600 dark:text-gray-400 pt-2">
                <span>Subtotal</span>
                <span>{formatLKR(subtotal)}</span>
              </div>
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>Shipping</span>
                <span>{formatLKR(shipping)}</span>
              </div>
              {appliedPromo && (
                <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                  <span>Discount ({appliedPromo.code})</span>
                  <span>-{formatLKR(discount)}</span>
                </div>
              )}
              <div className="border-t border-fuchsia-100 dark:border-zinc-800 pt-2 mt-2 flex justify-between font-bold text-base text-gray-900 dark:text-gray-100">
                <span>Total</span>
                <span>{formatLKR(total)}</span>
              </div>
            </div>

            {orderError && (
              <p className="mt-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-600 dark:border-red-900/50 dark:bg-red-950/40 dark:text-red-400">
                {orderError}
              </p>
            )}

            <Button
              variant="shoe"
              className="w-full mt-6"
              onClick={handlePlaceOrder}
              disabled={isPlacing}
            >
              {isPlacing ? "Placing Order..." : "Place Order"}
            </Button>
          </Card>
        </div>
      </div>
    </div>
  );
}