import { prisma } from "@/lib/prisma";

/**
 * A single cart line whose stock has to be checked against the database.
 * `variantId` is used when known; otherwise the selected variant values are
 * matched to a product variant (same rules the order endpoint uses).
 */
export type StockLine = {
  productId: number;
  variantId?: number | null;
  selectedVariants?: Record<string, unknown> | null;
};

export type StockLineResult = {
  productId: number;
  productVariantId: number | null;
  name: string | null;
  /** Units currently available for this cart line. */
  stock: number;
  /** False when the product no longer exists. */
  found: boolean;
};

type VariantCandidate = {
  id: number;
  stock: number;
  values: { variantValueId: number }[];
};

function toPositiveInt(value: unknown): number | null {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function selectedValueIds(selectedVariants: unknown): number[] {
  if (!selectedVariants || typeof selectedVariants !== "object") return [];

  return Object.values(selectedVariants as Record<string, unknown>)
    .map((value) => toPositiveInt(value))
    .filter((value): value is number => value !== null);
}

/**
 * Picks the variant that matches the shopper's selection. An explicit
 * `variantId` wins as long as it belongs to the product; otherwise the
 * selected variant values must match the variant exactly.
 */
export function resolveVariantId(
  candidates: VariantCandidate[],
  variantId: unknown,
  selectedVariants: unknown,
): number | null {
  const explicitId = toPositiveInt(variantId);
  if (explicitId && candidates.some((variant) => variant.id === explicitId)) {
    return explicitId;
  }

  const selectedIds = selectedValueIds(selectedVariants);
  if (selectedIds.length > 0) {
    const match = candidates.find((variant) => {
      const valueIds = variant.values.map((value) => value.variantValueId);
      return (
        selectedIds.every((id) => valueIds.includes(id)) &&
        valueIds.every((id) => selectedIds.includes(id))
      );
    });
    if (match) return match.id;
  }

  // A product with a single variant has no real choice to make.
  if (candidates.length === 1) return candidates[0].id;

  return null;
}

/**
 * Reads live stock for a set of cart lines.
 *
 * When a variant is resolved its own stock is authoritative. Otherwise the
 * product-level stock is used (falling back to the sum of its variants, which
 * is how the vendor app keeps `Product.stock` up to date).
 */
export async function checkStockForLines(
  lines: StockLine[],
): Promise<StockLineResult[]> {
  const productIds = Array.from(
    new Set(
      lines
        .map((line) => toPositiveInt(line.productId))
        .filter((id): id is number => id !== null),
    ),
  );

  if (productIds.length === 0) return [];

  const products = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: {
      id: true,
      name: true,
      stock: true,
      variants: {
        select: {
          id: true,
          stock: true,
          values: { select: { variantValueId: true } },
        },
      },
    },
  });

  const productsById = new Map(products.map((product) => [product.id, product]));

  return lines.map((line) => {
    const productId = toPositiveInt(line.productId) ?? 0;
    const product = productsById.get(productId);

    if (!product) {
      return {
        productId,
        productVariantId: null,
        name: null,
        stock: 0,
        found: false,
      };
    }

    const productVariantId = resolveVariantId(
      product.variants,
      line.variantId,
      line.selectedVariants,
    );

    const variant = productVariantId
      ? product.variants.find((item) => item.id === productVariantId)
      : null;

    const fallbackStock = product.variants.length
      ? product.variants.reduce(
          (sum, item) => sum + Math.max(0, item.stock),
          0,
        )
      : product.stock;

    return {
      productId: product.id,
      productVariantId,
      name: product.name,
      stock: Math.max(0, variant ? variant.stock : fallbackStock),
      found: true,
    };
  });
}
