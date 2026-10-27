// src/lib/offer-basis.ts — server-side validation for Offer.basis / Offer.subCategoryId
import { prisma } from "@/lib/prisma";

export const OFFER_BASES = [
  "FESTIVE",
  "SPECIAL_DAY",
  "ANNIVERSARY",
  "NEW_CUSTOMER",
  "FLASH_SALE",
  "END_OF_SEASON",
  "PAYDAY",
  "PAYMENT",
  "LOYALTY",
  "PRODUCT_LAUNCH",
  "CLEARANCE",
  "BUNDLE",
  "CATEGORY",
  "OTHER",
] as const;

export type OfferBasisValue = (typeof OFFER_BASES)[number];

/** Keep in sync with BASIS_WITH_SUBCATEGORY in offer-form.tsx */
export const BASES_REQUIRING_SUBCATEGORY: OfferBasisValue[] = [
  "CATEGORY",
  "END_OF_SEASON",
  "CLEARANCE",
];

type Input = {
  basis: unknown;
  subCategoryId: unknown;
  productIds?: number[];
};

type Result =
  | { ok: true; basis: OfferBasisValue | null; subCategoryId: number | null }
  | { ok: false; error: string };

export async function resolveBasisFields(input: Input): Promise<Result> {
  // ── basis ──
  let basis: OfferBasisValue | null = null;
  if (input.basis !== null && input.basis !== undefined && input.basis !== "") {
    if (!OFFER_BASES.includes(input.basis as OfferBasisValue)) {
      return { ok: false, error: "Invalid offer basis." };
    }
    basis = input.basis as OfferBasisValue;
  }

  const needsSub = basis !== null && BASES_REQUIRING_SUBCATEGORY.includes(basis);

  // A basis that doesn't use a sub category always stores null.
  if (!needsSub) return { ok: true, basis, subCategoryId: null };

  // ── sub category ──
  const subCategoryId = Number(input.subCategoryId);
  if (!input.subCategoryId || !Number.isInteger(subCategoryId) || subCategoryId <= 0) {
    return { ok: false, error: "A sub category is required for this offer type." };
  }

  const sub = await prisma.subCategory.findUnique({
    where: { id: subCategoryId },
    select: { id: true },
  });
  if (!sub) return { ok: false, error: "Selected sub category was not found." };

  // ── every selected product must belong to that sub category ──
  if (input.productIds && input.productIds.length > 0) {
    const mismatched = await prisma.product.count({
      where: {
        id: { in: input.productIds },
        OR: [{ subcategoryId: null }, { subcategoryId: { not: subCategoryId } }],
      },
    });
    if (mismatched > 0) {
      return {
        ok: false,
        error: "All selected products must belong to the chosen sub category.",
      };
    }
  }

  return { ok: true, basis, subCategoryId };
}