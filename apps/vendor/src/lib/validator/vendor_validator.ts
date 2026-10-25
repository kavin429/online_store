import { z } from "zod";

export const vendorSchema = z.object({
  name: z
    .string()
    .min(1, "Vendor name is required")
    .max(120, "Vendor name is too long"),

  email: z
    .string()
    .min(1, "Email is required")
    .email("Enter a valid email address"),

  phone: z
    .string()
    .min(1, "Phone number is required")
    .regex(/^[0-9+\-\s()]{7,20}$/, "Enter a valid phone number"),

  country: z.string().max(100).optional().or(z.literal("")),
  province: z.string().max(100).optional().or(z.literal("")),
  district: z.string().max(100).optional().or(z.literal("")),
  city: z.string().max(100).optional().or(z.literal("")),
  address: z.string().max(255).optional().or(z.literal("")),

  status: z.enum(["PENDING", "CANCELLED", "ACTIVE", "BLOCKED"]).default("ACTIVE"),

  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional()
    .or(z.literal("")),
});

export type VendorFormValues = z.infer<typeof vendorSchema>;