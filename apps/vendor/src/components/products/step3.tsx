"use client";

import React from "react";
import { Input } from "@online-store/ui/input";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@online-store/ui/form";

type Step3Props = {
  form: any;
};

export default function Step3({ form }: Step3Props) {
  const sellingPriceRaw = form.watch("sellingPrice");
  const discountRaw = form.watch("discountPercent");

  const sellingPrice = Number(sellingPriceRaw);
  const discountPercent = Number(discountRaw);

  const hasValidSellingPrice = sellingPriceRaw !== "" && !Number.isNaN(sellingPrice);
  const hasValidDiscount =
    discountRaw !== "" && discountRaw !== undefined && !Number.isNaN(discountPercent) && discountPercent > 0;

  const finalPrice = hasValidSellingPrice
    ? hasValidDiscount
      ? sellingPrice - (sellingPrice * discountPercent) / 100
      : sellingPrice
    : null;
  const formatPriceOnBlur = (fieldOnChange: (v: string) => void, rawValue: string) => {
    if (rawValue === "" || rawValue === undefined) return;
    const num = Number(rawValue);
    if (!Number.isNaN(num)) {
      fieldOnChange(num.toFixed(2));
    }
  };

  const stripCurrencyPrefix = (value: string) => value.replace(/^Rs\.\s?/, "");

  return (
    <Form {...form}>
      <div className="space-y-10">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <FormField
          control={form.control}
          name="costPrice"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Cost Price</FormLabel>
              <FormControl>
                <div className="relative">
                  <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                    Rs.
                  </span>
                  <Input
                    type="number"
                    placeholder="0.00"
                    className="pl-10"
                    {...field}
                    onChange={(e) => field.onChange(stripCurrencyPrefix(e.target.value))}
                    onBlur={(e) => {
                      field.onBlur();
                      formatPriceOnBlur(field.onChange, e.target.value);
                    }}
                  />
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

          <FormField
            control={form.control}
            name="sellingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Selling Price (Base Price)</FormLabel>
                <FormControl>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                      Rs.
                    </span>
                    <Input
                      type="number"
                      placeholder="0.00"
                      className="pl-10"
                      {...field}
                      onChange={(e) => field.onChange(stripCurrencyPrefix(e.target.value))}
                      onBlur={(e) => {
                        field.onBlur();
                        formatPriceOnBlur(field.onChange, e.target.value);
                      }}
                    />
                  </div>
                </FormControl>
                <p className="text-[11px] text-muted-foreground">
                  Variant price adjustments from the previous step apply on top
                  of this price.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="discountPercent"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Discount % <span className="text-muted-foreground font-normal">(optional)</span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    placeholder="e.g. 10"
                    min={0}
                    max={100}
                    {...field}
                    onChange={(e) => {
                      const raw = e.target.value;
                      if (raw === "") {
                        field.onChange(raw);
                        return;
                      }
                      const num = Number(raw);
                      if (Number.isNaN(num)) return;
                      const clamped = Math.min(100, Math.max(0, num));
                      field.onChange(String(clamped));
                    }}
                  />
                </FormControl>
                <p className="text-[11px] text-muted-foreground">
                  Leave empty if this product has no discount. Max 100%.
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {finalPrice !== null && (
          <div className="rounded-md border p-3 text-sm flex items-center justify-between">
            <span className="text-muted-foreground">Price after discount</span>
            <span className="font-semibold">
              {hasValidDiscount ? (
                <>
                  <span className="line-through text-muted-foreground mr-2">
                    Rs. {sellingPrice.toFixed(2)}
                  </span>
                  Rs. {finalPrice.toFixed(2)}
                </>
              ) : (
                `Rs. ${sellingPrice.toFixed(2)}`
              )}
            </span>
          </div>
        )}
      </div>
    </Form>
  );
}