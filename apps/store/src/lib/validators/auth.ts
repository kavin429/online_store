import { z } from "zod";
import {
  SUPPORTED_COUNTRIES,
  validatePhoneForCountry,
} from "@/lib/geo";

/**
 * Shared by the signup form and the signup API so the client and server agree
 * on every rule (password strength, confirmation, country-aware phone check).
 */
export const signupSchema = z
  .object({
    name: z
      .string()
      .min(3, "Username must be at least 3 characters")
      .max(40, "Username must be 40 characters or fewer"),
    email: z
      .string()
      .min(1, "Email is required")
      .email("Enter a valid email address"),
    phoneCode: z.string().optional(),
    phone: z.string().min(1, "Mobile number is required"),
    country: z
      .string()
      .min(1, "Country is required")
      .refine(
        (value) => SUPPORTED_COUNTRIES.includes(value),
        "Select a supported country"
      ),
    province: z.string().min(1, "Province is required"),
    district: z.string().min(1, "District is required"),
    city: z.string().min(1, "City is required"),
    address: z.string().min(5, "Address must be at least 5 characters"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(/[A-Za-z]/, "Password must include at least one letter")
      .regex(/[0-9]/, "Password must include at least one number"),
    confirmPassword: z.string().min(1, "Confirm your password"),
    verificationMethod: z.enum(["email", "phone"]),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["confirmPassword"],
        message: "Passwords do not match",
      });
    }

    const phone = validatePhoneForCountry(data.phone, data.country);
    if (!phone.ok) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: phone.error,
      });
    }
  });

export type SignupValues = z.infer<typeof signupSchema>;

export const emailSchema = z
  .string()
  .min(1, "Email is required")
  .email("Enter a valid email address");

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}
