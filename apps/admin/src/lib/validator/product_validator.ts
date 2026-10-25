import * as z from "zod";

export const productSchema = z.object({
  name: z.string().min(3),
  description: z.string().min(10),

  categoryId: z.string().min(1),
  subcategoryId: z.string().min(1),

  featured: z.boolean().optional(),

  images: z.any(),

  optionTypes: z.array(z.enum(["color", "size", "weight", "volume"])).optional(),

  variantTypeIds: z.array(z.number()).optional(),

  options: z.object({
    color: z.array(z.any()).optional(),
    size: z.array(z.any()).optional(),
    weight: z.array(z.any()).optional(),
    volume: z.array(z.any()).optional(),
  }),

  costPrice: z.string().min(1, "Cost price is required"),
  sellingPrice: z.string().min(1, "Selling price is required"),
  discountPercent: z.string().optional(),
});

export type ProductFormValues = z.infer<typeof productSchema>;
