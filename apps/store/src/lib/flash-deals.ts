import { prisma } from "@/lib/prisma";

export type FlashDeal = {
  id: number;
  name: string;
  image: string | null;
  /** Price the shopper pays (after the product discount, when present). */
  price: number;
  /** Price before the discount, used for the strikethrough. */
  originalPrice: number;
  /** Units still available (product stock or the sum of its variants). */
  stock: number;
  href: string;
};

export type FlashDealsResult = {
  deals: FlashDeal[];
  endsAt: string | null;
  viewAllHref: string;
};

type FlashProduct = {
  id: number;
  name: string;
  sellingPrice: number | null;
  discountPercent: number | null;
  stock: number;
  images: { data: Uint8Array }[];
  variants: { stock: number }[];
};

const productInclude = {
  images: { take: 1, select: { data: true } },
  variants: { select: { stock: true } },
} as const;

function toFlashDeal(product: FlashProduct): FlashDeal | null {
  const originalPrice = product.sellingPrice ?? 0;

  if (originalPrice <= 0) return null;

  const discount = product.discountPercent ?? 0;
  const price =
    discount > 0 ? originalPrice * (1 - discount / 100) : originalPrice;

  const variantStock = product.variants.reduce(
    (total, variant) => total + variant.stock,
    0
  );
  const stock = product.stock > 0 ? product.stock : variantStock;

  return {
    id: product.id,
    name: product.name,
    image: product.images[0]?.data
      ? `data:image/jpeg;base64,${Buffer.from(
          product.images[0].data
        ).toString("base64")}`
      : null,
    price: Math.round(price * 100) / 100,
    originalPrice,
    stock: Math.max(0, stock),
    href: `/products/${product.id}`,
  };
}

/**
 * Loads the deals shown in the home page "Flash Deals" section.
 *
 * Priority:
 *  1. Active offers marked as FLASH_SALE (dates respected).
 *  2. Products that carry a discount and are still in stock.
 */
export async function getFlashDeals(limit = 4): Promise<FlashDealsResult> {
  const now = new Date();

  const offers = await prisma.offer.findMany({
    where: {
      status: "ACTIVE",
      basis: "FLASH_SALE",
      AND: [
        { OR: [{ startsAt: null }, { startsAt: { lte: now } }] },
        { OR: [{ endsAt: null }, { endsAt: { gte: now } }] },
      ],
    },
    orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
    include: {
      products: {
        include: {
          product: {
            include: productInclude,
          },
        },
      },
    },
  });

  for (const offer of offers) {
    const deals = offer.products
      .map(({ product }) => toFlashDeal(product))
      .filter((deal): deal is FlashDeal => deal !== null && deal.stock > 0)
      .slice(0, limit);

    if (deals.length > 0) {
      return {
        deals,
        endsAt: offer.endsAt ? offer.endsAt.toISOString() : null,
        viewAllHref: `/offers/${offer.id}`,
      };
    }
  }

  // Fallback so the section still has real data when no FLASH_SALE offer has
  // been configured yet: show the most heavily discounted in-stock products.
  const products = await prisma.product.findMany({
    where: {
      discountPercent: { gt: 0 },
      OR: [
        { stock: { gt: 0 } },
        { variants: { some: { stock: { gt: 0 } } } },
      ],
    },
    orderBy: [{ discountPercent: "desc" }, { createdAt: "desc" }],
    take: limit,
    include: productInclude,
  });

  return {
    deals: products
      .map(toFlashDeal)
      .filter((deal): deal is FlashDeal => deal !== null && deal.stock > 0),
    endsAt: null,
    viewAllHref: "/products",
  };
}
