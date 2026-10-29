"use client";

import React, { useEffect, useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@online-store/ui/form";
import { Input } from "@online-store/ui/input";
import { Textarea } from "@online-store/ui/textarea";
import { Switch } from "@online-store/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@online-store/ui/select";
import { Upload, X } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import type { VariantType } from "@/lib/types";

type CategoryType = {
  id: number;
  name: string;
  subcategories: { id: number; name: string }[];
};

type SubcategoryWithVariants = {
  id: number;
  name: string;
  variantTypes?: VariantType[];
  variantTypeIds?: number[];
};

type Step1Props = {
  form: UseFormReturn<any>;
  previews: string[];
  setPreviews: React.Dispatch<React.SetStateAction<string[]>>;
};

export default function Step1({ form, previews, setPreviews }: Step1Props) {
  const [categories, setCategories] = useState<CategoryType[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<number | null>(
    form.getValues("categoryId") ? Number(form.getValues("categoryId")) : null
  );

  // Sync selectedCategory when form value changes (e.g. after form.reset in edit mode)
  useEffect(() => {
    const subscription = form.watch((values) => {
      const catId = values.categoryId ? Number(values.categoryId) : null;
      setSelectedCategory(catId);
    });
    return () => subscription.unsubscribe();
  }, [form]);

  const [subcategories, setSubcategories] = useState<SubcategoryWithVariants[]>([]);
  const [loadingSubcategories, setLoadingSubcategories] = useState(false);

  const [availableVariantTypes, setAvailableVariantTypes] = useState<VariantType[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch("/api/categories");
        if (!res.ok) throw new Error("Failed to fetch categories");
        const data = await res.json();
        setCategories(data);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setSubcategories([]);
      setAvailableVariantTypes([]);
      return;
    }

    let cancelled = false;
    setLoadingSubcategories(true);

    fetch(`/api/subcategories?categoryId=${selectedCategory}`)
      .then((res) => res.json())
      .then((data: SubcategoryWithVariants[]) => {
        if (!cancelled) {
          setSubcategories(data);
          // If form already has a subcategoryId (edit mode), sync variant types
          const currentSubId = form.getValues("subcategoryId");
          if (currentSubId) {
            const match = data.find((s) => s.id === Number(currentSubId));
            if (match) {
              setAvailableVariantTypes(match.variantTypes || []);
            }
          }
        }
      })
      .catch((err) => console.error("Failed to fetch subcategories:", err))
      .finally(() => {
        if (!cancelled) setLoadingSubcategories(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCategory]);

  const handleSubcategoryChange = (subcategoryIdRaw: string) => {
    form.setValue("subcategoryId", subcategoryIdRaw);
    form.setValue("options", { color: [], size: [], weight: [], volume: [] });

    const subcategoryId = Number(subcategoryIdRaw);
    const match = subcategories.find((s) => s.id === subcategoryId);
    setAvailableVariantTypes(match?.variantTypes || []);
    form.setValue("variantTypeIds", []);
  };

  const handleFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;

    if (!files) return;

    const fileArray = Array.from(files);
    const urls = fileArray.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviews((prev) => [...prev, ...urls]);
    const existingFiles = form.getValues("images") || [];

    form.setValue("images", [...existingFiles, ...fileArray]);
  };

  const removeImage = (index: number) => {
    const updatedPreviews = previews.filter((_, i) => i !== index);
    setPreviews(updatedPreviews);
    const existingFiles = form.getValues("images") || [];

    const updatedFiles = existingFiles.filter(
      (_: File, i: number) => i !== index
    );

    form.setValue("images", updatedFiles);
  };

  return (
    <Form {...form}>
      <form className="space-y-6">
        {/* Stacked on mobile, side by side from sm up */}
        <div className="flex flex-col gap-4 sm:flex-row">
          {/* Category Select */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="w-full flex-1">
                <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                  Category
                </FormLabel>
                <Select
                  name={field.name}
                  value={field.value ? String(field.value) : ""}
                  onValueChange={(rawVal) => {
                    const numVal = rawVal ? Number(rawVal) : null;
                    setSelectedCategory(numVal);
                    field.onChange(rawVal);
                    form.setValue("subcategoryId", "");
                    form.setValue("variantTypeIds", []);
                    setAvailableVariantTypes([]);
                  }}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={String(cat.id)}>
                        {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subcategory Select */}
          <FormField
            control={form.control}
            name="subcategoryId"
            render={({ field }) => (
              <FormItem className="w-full flex-1">
                <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                  Subcategory
                </FormLabel>
                <Select
                  name={field.name}
                  value={field.value ? String(field.value) : ""}
                  onValueChange={handleSubcategoryChange}
                  disabled={!selectedCategory || loadingSubcategories}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue
                        placeholder={
                          loadingSubcategories
                            ? "Loading..."
                            : "Select subcategory"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {subcategories.map((sub) => (
                      <SelectItem key={sub.id} value={String(sub.id)}>
                        {sub.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Product Name */}
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                Product Name
              </FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter product name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Variants */}
        <FormField
          control={form.control}
          name="variantTypeIds"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                Available Variants
              </FormLabel>
              <FormControl>
                <div className="flex flex-wrap gap-3 rounded-md border border-fuchsia-200 bg-fuchsia-50/40 p-3 sm:gap-4 dark:border-fuchsia-900/50 dark:bg-fuchsia-950/10">
                  {!selectedCategory && (
                    <p className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
                      Select a category and subcategory first.
                    </p>
                  )}
                  {selectedCategory && !form.getValues("subcategoryId") && (
                    <p className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
                      Select a subcategory to see its available variants.
                    </p>
                  )}
                  {selectedCategory &&
                    form.getValues("subcategoryId") &&
                    availableVariantTypes.length === 0 && (
                      <p className="text-sm text-fuchsia-700/70 dark:text-fuchsia-300/70">
                        This subcategory has no variant types configured.
                      </p>
                    )}
                  {availableVariantTypes.map((variantType) => (
                    <label
                      key={variantType.id}
                      className="flex cursor-pointer items-center gap-2 text-sm"
                    >
                      <input
                        type="checkbox"
                        value={variantType.id}
                        className="h-4 w-4 accent-fuchsia-600"
                        checked={field.value?.map(Number).includes(Number(variantType.id))}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const current: number[] = field.value || [];
                          const newValue = checked
                            ? [...current, variantType.id]
                            : current.filter((id: number) => id !== variantType.id);

                          field.onChange(newValue);
                        }}
                      />
                      {variantType.name}
                    </label>
                  ))}
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Featured Switch */}
        <FormField
          control={form.control}
          name="featured"
          render={({ field }) => (
            <FormItem className="flex items-center justify-between gap-3 rounded-md border border-fuchsia-200 p-3 dark:border-fuchsia-900/50">
              <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                Featured Product
              </FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
                  className="data-[state=checked]:bg-fuchsia-600"
                />
              </FormControl>
            </FormItem>
          )}
        />

        {/* Description */}
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                Description
              </FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  placeholder="Enter product description"
                  className="border-fuchsia-200 text-base placeholder:text-fuchsia-400 hover:border-fuchsia-300 focus-visible:border-fuchsia-500 focus-visible:ring-1 focus-visible:ring-fuchsia-500 sm:text-sm dark:border-fuchsia-900/50"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Images */}
        <FormField
          control={form.control}
          name="images"
          render={() => (
            <FormItem>
              <FormLabel className="text-fuchsia-900 dark:text-fuchsia-200">
                Product Images
              </FormLabel>
              <div className="flex flex-col gap-2">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesChange}
                  className="hidden"
                  id="product-images"
                />
                <label
                  htmlFor="product-images"
                  className="flex cursor-pointer items-center justify-center rounded-md border border-dashed border-fuchsia-300 p-4 text-sm text-fuchsia-700 transition-colors hover:bg-fuchsia-50 dark:border-fuchsia-800 dark:text-fuchsia-300 dark:hover:bg-fuchsia-950/30"
                >
                  <Upload className="mr-2 h-5 w-5 text-fuchsia-500" /> Upload Images
                </label>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="group relative overflow-hidden rounded-lg border border-fuchsia-200 dark:border-fuchsia-900/50"
                  >
                    <img
                      src={src}
                      alt={`Preview ${i}`}
                      className="h-28 w-full object-cover sm:h-32"
                    />

                    {/* Image Number */}
                    <div className="absolute left-1 top-1 rounded bg-fuchsia-700/80 px-2 py-1 text-xs text-white">
                      {i + 1}
                    </div>

                    {/* Remove Button: always visible on touch screens, hover on larger */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute right-1 top-1 rounded-full bg-red-500 p-1 text-white transition hover:bg-red-600 sm:opacity-0 sm:group-hover:opacity-100"
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            </FormItem>
          )}
        />
      </form>
    </Form>
  );
}