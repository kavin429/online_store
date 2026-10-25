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


        <div className="flex gap-4">
          {/* Category Dropdown */}
          <FormField
            control={form.control}
            name="categoryId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Category</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    onChange={(e) => {
                      const rawVal = e.target.value;
                      const numVal = rawVal ? Number(rawVal) : null;
                      setSelectedCategory(numVal);
                      field.onChange(rawVal);
                      form.setValue("subcategoryId", "");
                      form.setValue("variantTypeIds", []);
                      setAvailableVariantTypes([]);
                    }}
                    className="border rounded p-2 w-full"
                  >
                    <option value="">Select category</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Subcategory Dropdown */}
          <FormField
            control={form.control}
            name="subcategoryId"
            render={({ field }) => (
              <FormItem className="flex-1">
                <FormLabel>Subcategory</FormLabel>
                <FormControl>
                  <select
                    {...field}
                    onChange={(e) => handleSubcategoryChange(e.target.value)}
                    className="border rounded p-2 w-full"
                    disabled={!selectedCategory || loadingSubcategories}
                  >
                    <option value="">
                      {loadingSubcategories ? "Loading..." : "Select subcategory"}
                    </option>
                    {subcategories.map((sub) => (
                      <option key={sub.id} value={sub.id}>
                        {sub.name}
                      </option>
                    ))}
                  </select>
                </FormControl>
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
              <FormLabel>Product Name</FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter product name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="variantTypeIds"
          render={({ field }) => (
            <FormItem className="flex-1">
              <FormLabel>Available Variants</FormLabel>
              <FormControl>
                <div className="flex gap-4 flex-wrap border rounded p-3">
                  {!selectedCategory && (
                    <p className="text-sm text-muted-foreground">
                      Select a category and subcategory first.
                    </p>
                  )}
                  {selectedCategory && !form.getValues("subcategoryId") && (
                    <p className="text-sm text-muted-foreground">
                      Select a subcategory to see its available variants.
                    </p>
                  )}
                  {selectedCategory &&
                    form.getValues("subcategoryId") &&
                    availableVariantTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground">
                        This subcategory has no variant types configured.
                      </p>
                    )}
                  {availableVariantTypes.map((variantType) => (
                    <label key={variantType.id} className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        value={variantType.id}
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
            <FormItem className="flex items-center justify-between border p-3 rounded">
              <FormLabel>Featured Product</FormLabel>
              <FormControl>
                <Switch
                  checked={field.value}
                  onCheckedChange={field.onChange}
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter product description" />
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
              <FormLabel>Product Images</FormLabel>
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
                  className="flex items-center justify-center cursor-pointer border border-dashed p-4 rounded hover:bg-gray-100 dark:hover:bg-gray-900"
                >
                  <Upload className="mr-2 w-5 h-5" /> Upload Images
                </label>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                {previews.map((src, i) => (
                  <div
                    key={i}
                    className="relative border rounded-lg overflow-hidden group"
                  >
                    <img
                      src={src}
                      alt={`Preview ${i}`}
                      className="w-full h-32 object-cover"
                    />

                    {/* Image Number */}
                    <div className="absolute top-1 left-1 bg-black/60 text-white text-xs px-2 py-1 rounded">
                      {i + 1}
                    </div>

                    {/* Remove Button */}
                    <button
                      type="button"
                      onClick={() => removeImage(i)}
                      className="absolute top-1 right-1 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
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