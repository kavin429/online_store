// src/lib/validator/category_validator.ts
import { z } from "zod";

// Category schema
export const categorySchema = z.object({
  name: z
    .string()
    .min(2, "Category name must be at least 2 characters")
    .max(50, "Category name cannot exceed 50 characters")
    .nonempty("Category name is required"),

  image: z
    .any()
    .refine(
      (files) => !files || (files instanceof FileList && files.length <= 1),
      "You can upload only one image"
    )
    .refine(
      (files) =>
        !files ||
        (files instanceof FileList &&
          (!files[0] || files[0].type.startsWith("image/"))),
      "Only image files are allowed"
    )
    .optional(),
});

export type CategoryFormValues = z.infer<typeof categorySchema>;