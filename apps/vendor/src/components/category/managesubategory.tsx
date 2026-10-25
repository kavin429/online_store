"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@online-store/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@online-store/ui/dialog";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@online-store/ui/form";
import { Checkbox } from "@online-store/ui/checkbox";
import { toast } from "sonner";
import {
  subcategorySchema,
  SubcategoryFormValues,
} from "@/lib/validator/subcategory_validator";

type VariantType = {
  id: number;
  name: string;
  slug: string;
};

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  categoryId: number;
  categoryName: string;
  defaultValues?: {
    id?: number;
    name: string;
    status?: "ACTIVE" | "PENDING";
    description?: string;
    commission?: number;
    imageUrl?: string;
    variantTypeIds?: number[];
  };
  onAdd: (sub: any) => void;
};

export default function ManageSubcategoryDialog({
  open,
  setOpen,
  categoryId,
  categoryName,
  defaultValues,
  onAdd,
}: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.imageUrl || null,
  );
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [loadingVariantTypes, setLoadingVariantTypes] = useState(false);

  const form = useForm<SubcategoryFormValues>({
    resolver: zodResolver(subcategorySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      status: defaultValues?.status || "ACTIVE",
      description: defaultValues?.description || "",
      commission: defaultValues?.commission,
      variantTypeIds: defaultValues?.variantTypeIds || [],
      image: undefined,
    },
  });

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoadingVariantTypes(true);
    fetch("/api/variants")
      .then((res) => res.json())
      .then((data: VariantType[]) => {
        if (!cancelled) setVariantTypes(data);
      })
      .catch((err) => console.error("Failed to load variant types", err))
      .finally(() => {
        if (!cancelled) setLoadingVariantTypes(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open]);

  useEffect(() => {
    setImagePreview(defaultValues?.imageUrl || null);
    form.reset({
      name: defaultValues?.name || "",
      status: defaultValues?.status || "ACTIVE",
      description: defaultValues?.description || "",
      commission: defaultValues?.commission,
      variantTypeIds: defaultValues?.variantTypeIds || [],
      image: undefined,
    });
  }, [defaultValues, open, form]);

  const onSubmit = async (values: SubcategoryFormValues) => {
    const isEdit = !!defaultValues?.id;
    const url = isEdit
      ? `/api/subcategories/${defaultValues.id}`
      : `/api/subcategories`;
    const method = isEdit ? "PUT" : "POST";

    try {
      const formData = new FormData();
      formData.append("name", values.name);
      formData.append("status", values.status);
      if (values.description)
        formData.append("description", values.description);
      if (values.commission !== undefined)
        formData.append("commission", values.commission.toString());
      formData.append("categoryId", categoryId.toString());
      // Send selected variant type ids as a JSON string
      formData.append(
        "variantTypeIds",
        JSON.stringify(values.variantTypeIds || []),
      );
      if (values.image?.[0]) formData.append("image", values.image[0]);

      const res = await fetch(url, { method, body: formData });
      if (!res.ok) throw new Error("Failed to save subcategory");

      const savedSub = await res.json();
      onAdd(savedSub);
      toast.success(isEdit ? "Subcategory updated!" : "Subcategory added!");
      if (!isEdit) {
        form.reset({ name: "", status: "ACTIVE", description: "", commission: undefined, variantTypeIds: [], image: undefined });
        setImagePreview(null);
      }
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(isEdit ? "Update failed" : "Add failed");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto space-y-4">
        <DialogHeader>
          <DialogTitle>
            {defaultValues
              ? "Edit Subcategory"
              : `Add Subcategory for ${categoryName}`}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory Name</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Enter subcategory name"
                      className="border p-2 w-full rounded"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Commission */}
              <FormField
                control={form.control}
                name="commission"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Commission (%)</FormLabel>
                    <FormControl>
                      <input
                        type="number"
                        {...field}
                        placeholder="0 - 100"
                        min={0}
                        max={100}
                        className="border p-2 w-full rounded"
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Status */}
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <FormControl>
                      <select {...field} className="border p-2 w-full rounded">
                        <option value="ACTIVE">Active</option>
                        <option value="PENDING">Pending</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Description */}
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      placeholder="Optional description"
                      className="border p-2 w-full rounded"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Variant type checkboxes */}
            <FormField
              control={form.control}
              name="variantTypeIds"
              render={() => (
                <FormItem>
                  <FormLabel>Variants</FormLabel>
                  <div className="grid grid-cols-2 gap-2 border rounded p-3">
                    {loadingVariantTypes && (
                      <p className="text-sm text-muted-foreground col-span-2">
                        Loading variants...
                      </p>
                    )}
                    {!loadingVariantTypes && variantTypes.length === 0 && (
                      <p className="text-sm text-muted-foreground col-span-2">
                        No variants found.
                      </p>
                    )}
                    {variantTypes.map((variantType) => (
                      <FormField
                        key={variantType.id}
                        control={form.control}
                        name="variantTypeIds"
                        render={({ field }) => {
                          const current = field.value || [];
                          const checked = current.includes(variantType.id);
                          return (
                            <FormItem
                              key={variantType.id}
                              className="flex items-center gap-2 space-y-0"
                            >
                              <FormControl>
                                <Checkbox
                                  checked={checked}
                                  onCheckedChange={(isChecked) => {
                                    if (isChecked) {
                                      field.onChange([...current, variantType.id]);
                                    } else {
                                      field.onChange(
                                        current.filter((id) => id !== variantType.id),
                                      );
                                    }
                                  }}
                                />
                              </FormControl>
                              <FormLabel className="font-normal cursor-pointer">
                                {variantType.name}
                              </FormLabel>
                            </FormItem>
                          );
                        }}
                      />
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Image */}
            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Subcategory Image</FormLabel>
                  <FormControl>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => {
                        field.onChange(e.target.files);
                        if (e.target.files?.[0]) {
                          const url = URL.createObjectURL(e.target.files[0]);
                          setImagePreview(url);
                        }
                      }}
                      className="border p-2 w-full rounded"
                    />
                  </FormControl>
                  {imagePreview && (
                    <img
                      src={imagePreview}
                      alt="Preview"
                      className="w-32 h-32 object-cover rounded mt-2"
                    />
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button
                size="sm"
                variant="outline"
                type="button"
                onClick={() => setOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="shoesecondary"
                size="sm"
                type="submit"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? "Saving..."
                  : defaultValues
                    ? "Update Subcategory"
                    : "Add Subcategory"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}