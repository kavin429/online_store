import { z } from "zod";

// SubCategory form values
export const subcategorySchema = z.object({
  name: z.string().min(1, "Name is required"),
  status: z.enum(["ACTIVE", "PENDING"]),
  description: z.string().optional(),
  commission: z
    .number({ invalid_type_error: "Commission must be a number" })
    .min(0, "Commission cannot be less than 0")
    .max(100, "Commission cannot be more than 100")
    .optional(),
  image: z
    .any()
    .refine(
      (files) => !files || files.length === 0 || files[0] instanceof File,
      "Invalid file"
    )
    .optional(),
  variantTypeIds: z.array(z.number()).optional(),
});

export type SubcategoryFormValues = z.infer<typeof subcategorySchema>;