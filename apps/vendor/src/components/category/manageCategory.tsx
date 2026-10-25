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
  FormDescription,
  FormMessage,
} from "@online-store/ui/form";
import { toast } from "sonner";
import { categorySchema, CategoryFormValues } from "@/lib/validator/category_validator";

type Props = {
  open: boolean;
  setOpen: (v: boolean) => void;
  onAdd: (category: any) => void;
  defaultValues?: {
    id?: number;
    name: string;
    imageUrl?: string;
  };
};

export default function AddCategoryDialog({
  open,
  setOpen,
  onAdd,
  defaultValues,
}: Props) {
  const [imagePreview, setImagePreview] = useState<string | null>(
    defaultValues?.imageUrl || null
  );

  const form = useForm<CategoryFormValues>({
    resolver: zodResolver(categorySchema),
    defaultValues: {
      name: defaultValues?.name || "",
      image: undefined,
    },
  });

  const loading = form.formState.isSubmitting;

  useEffect(() => {
    // Update preview if editing an existing category
    setImagePreview(defaultValues?.imageUrl || null);
    form.reset({
      name: defaultValues?.name || "",
      image: undefined,
    });
  }, [defaultValues, form]);
  useEffect(() => {
    if (!open) {
      form.reset({
        name: "",
        image: undefined,
      });
      setImagePreview(null);
    }
  }, [open]);
  const onSubmit = async (values: CategoryFormValues) => {
    const isEdit = !!defaultValues?.id;
    const url = isEdit
      ? `/api/categories/${defaultValues.id}`
      : "/api/categories";
    const method = isEdit ? "PUT" : "POST";

    try {
      const formData = new FormData();
      formData.append("name", values.name);

      if (values.image?.[0]) {
        formData.append("image", values.image[0]);
      }

      const res = await fetch(url, { method, body: formData });

      if (!res.ok) throw new Error("Failed to save category");

      const savedCategory = await res.json();
      onAdd(savedCategory);
      form.reset({
        name: "",
        image: undefined,
      });

      setImagePreview(null);
      setOpen(false);

      toast.success(
        isEdit
          ? "Category updated successfully!"
          : "Category added successfully!"
      );
    } catch (err) {
      console.error(err);

      toast.error(
        isEdit ? "Failed to update category" : "Failed to add category"
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-lg space-y-4">
        <DialogHeader>
          <DialogTitle>{defaultValues ? "Edit Category" : "Add New Category"}</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

            {/* Name */}
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <input
                      {...field}
                      placeholder="Enter category name"
                      className="border p-2 w-full rounded"
                    />
                  </FormControl>
                  <FormDescription>This will be displayed on the website.</FormDescription>
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
                  <FormLabel>Category Image</FormLabel>
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
                  <FormDescription>Upload category image (optional)</FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter className="flex justify-between">
              <Button variant="outline" type="button" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? "Saving..." : defaultValues ? "Update Category" : "Add Category"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}