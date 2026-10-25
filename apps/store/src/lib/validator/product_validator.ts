import * as z from "zod";

export const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),

  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),

  storeId: z.string().optional(),

  featured: z.boolean().optional(),

  images: z.any(),

  optionTypes: z.array(
    z.enum(["color", "size", "weight", "volume"])
  ).optional(),

  options: z.object({
    color: z.array(z.string()).optional(),
    size: z.array(z.string()).optional(),
    weight: z.array(z.string()).optional(),
    volume: z.array(z.string()).optional(),
  }),

  costPrice: z.string().min(1, "Cost price is required"),

  sellingPrice: z.string().min(1, "Selling price is required"),

  stock: z.string().min(1, "Stock is required"),
});

export type ProductFormValues = z.infer<typeof productSchema>;