"use client";

import React, { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@online-store/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@online-store/ui/tabs";
import { Button } from "@online-store/ui/button";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { productSchema, ProductFormValues } from "@/lib/validator/product_validator";
import { toast } from "sonner";
import { Pencil, Loader2 } from "lucide-react";

import Step1 from "./step1";
import Step2 from "./step2";
import Step3 from "./step3";

type EditProductDialogProps = {
  productId: number;
  onSaved?: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
};

export default function EditProductDialog({ productId, onSaved, open: controlledOpen, onOpenChange }: EditProductDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = isControlled ? (onOpenChange ?? (() => { })) : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [previews, setPreviews] = useState<string[]>([]);
  const [tab, setTab] = useState("details");

  const form = useForm<ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      categoryId: "",
      subcategoryId: "",
      featured: false,
      images: undefined,
      optionTypes: [],
      variantTypeIds: [],
      options: { color: [], size: [], weight: [], volume: [] },
      costPrice: "",
      sellingPrice: "",
      discountPercent: "",
    },
  });

  // Fetch the product and hydrate the form whenever the dialog opens
  useEffect(() => {
    if (!open) return;

    let cancelled = false;
    setLoading(true);

    fetch(`/api/products/${productId}`)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load product");
        return res.json();
      })
      .then(({ data: product }) => {
        if (cancelled) return;

        // Rebuild options from variants: collect unique variantValues per type slug
        const optionsMap: Record<string, any[]> = { color: [], size: [], weight: [], volume: [] };
        const seen: Record<string, Set<number>> = {};

        for (const variant of product.variants ?? []) {
          for (const [slug, attr] of Object.entries(variant.attributes) as [string, any][]) {
            if (!optionsMap[slug]) optionsMap[slug] = [];
            if (!seen[slug]) seen[slug] = new Set();
            if (!seen[slug].has(attr.id)) {
              seen[slug].add(attr.id);
              optionsMap[slug].push({
                variantValueId: attr.id,
                name: attr.name,
                hexCode: attr.hexCode ?? null,
                priceAdjustment: variant.priceOverride
                  ? variant.priceOverride - (product.sellingPrice ?? 0)
                  : 0,
                stock: variant.stock ?? 0,
                image: null,
                existingImageUrl: variant.image ?? null,
              });
            }
          }
        }

        // Derive variantTypeIds from the variants' attributes (DB-driven, not hardcoded)
        const variantTypeIdsSet = new Set<number>();
        for (const variant of product.variants ?? []) {
          for (const attr of Object.values(variant.attributes) as any[]) {
            if (attr.variantTypeId) variantTypeIdsSet.add(Number(attr.variantTypeId));
          }
        }

        form.reset({
          name: product.name ?? "",
          description: product.description ?? "",
          categoryId: String(product.categoryId ?? ""),
          subcategoryId: String(product.subcategoryId ?? ""),
          featured: !!product.featured,
          images: undefined,
          optionTypes: [],
          variantTypeIds: Array.from(variantTypeIdsSet),
          options: optionsMap,
          costPrice: String(product.costPrice ?? ""),
          sellingPrice: String(product.sellingPrice ?? ""),
          discountPercent: product.discountPercent ? String(product.discountPercent) : "",
        });

        setPreviews((product.images ?? []).map((img: { url: string }) => img.url));
      })
      .catch((err) => {
        console.error(err);
        toast.error("Couldn't load product details");
        setOpen(false);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, productId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = form.handleSubmit(
    async (values) => {
      setSubmitting(true);
      try {
        const formData = new FormData();
        formData.append("name", values.name);
        formData.append("description", values.description);
        formData.append("categoryId", values.categoryId);
        formData.append("subcategoryId", values.subcategoryId);
        formData.append("featured", String(values.featured));
        formData.append("optionTypes", JSON.stringify(values.optionTypes));
        formData.append("costPrice", values.costPrice);
        formData.append("sellingPrice", values.sellingPrice);
        if (values.discountPercent) formData.append("discountPercent", values.discountPercent);

        const cleanOptions = JSON.parse(
          JSON.stringify(
            Object.fromEntries(
              Object.entries(values.options).map(([key, arr]: any) => [
                key,
                arr.map((item: any) => {
                  if (item.image instanceof File) {
                    formData.append("optionImages", item.image);
                    return { ...item, image: item.image.name, existingImageUrl: undefined };
                  }
                  // keep existingImageUrl as-is if no new file was chosen
                  return { ...item, image: undefined };
                }),
              ])
            )
          )
        );
        formData.append("options", JSON.stringify(cleanOptions));

        // Only append newly-added product images (Files); existing ones stay untouched server-side
        const images = values.images;
        if (Array.isArray(images)) {
          images.forEach((file: File) => formData.append("images", file));
        }

        const res = await fetch(`/api/products/${productId}`, {
          method: "PATCH",
          body: formData,
        });

        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.error || "Failed to update product");
        }

        toast.success("Product updated successfully!");
        setOpen(false);
        onSaved?.();
      } catch (err) {
        console.error(err);
        toast.error("Something went wrong!");
      } finally {
        setSubmitting(false);
      }
    },
    (errors) => {
      console.error("Validation failed:", errors);
      toast.error("Please check the highlighted fields before saving.");
    },
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button variant="outline" size="icon">
            <Pencil className="h-4 w-4" />
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Product</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin mr-2" />
            Loading product...
          </div>
        ) : (
          <>
            <Tabs value={tab} onValueChange={setTab} className="mt-2">
              <TabsList className="grid grid-cols-3 w-full">
                <TabsTrigger value="details">Product Details</TabsTrigger>
                <TabsTrigger value="options">Product Options</TabsTrigger>
                <TabsTrigger value="pricing">Variants & Pricing</TabsTrigger>
              </TabsList>

              <TabsContent value="details" className="mt-4">
                <Step1 form={form} previews={previews} setPreviews={setPreviews} />
              </TabsContent>
              <TabsContent value="options" className="mt-4">
                <Step2 form={form} />
              </TabsContent>
              <TabsContent value="pricing" className="mt-4">
                <Step3 form={form} />
              </TabsContent>
            </Tabs>

            <DialogFooter className="mt-6">
              <Button variant="outline" onClick={() => setOpen(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button variant="shoe" onClick={handleSubmit} disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  "Save Changes"
                )}
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}