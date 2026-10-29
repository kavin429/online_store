import { prisma, sortBatchesForFifo } from "@/lib/prisma";

const DAY_MS = 24 * 60 * 60 * 1000;

export type InventoryBatchView = {
  id: number;
  quantity: number;
  remaining: number;
  expiresAt: Date | string | null;
  batchNumber: string | null;
  note: string | null;
  createdAt: Date | string;
};

export type InventoryView = {
  id: number;
  sku: string | null;
  product: { id: number; name: string };
  attributes: { type: string; value: string; hexCode: string | null }[];
  stock: number;
  priceOverride: number | null;
  batches: InventoryBatchView[];
  nearestExpiry: Date | string | null;
};

export type VendorInventoryResult = {
  data: InventoryView[];
  lowStockCount: number;
  expiredBatches: number;
  expiringSoonBatches: number;
};

/**
 * Builds the inventory view used by the vendor dashboard (server page) and the
 * /api/inventory route. Stock batches are returned oldest-expiry-first so the
 * UI matches the order FIFO will consume them in.
 */
export async function getVendorInventory(vendorId: number): Promise<VendorInventoryResult> {
  const products = await prisma.product.findMany({
    where: { vendorId },
    include: {
      variants: {
        include: {
          values: { include: { variantValue: { include: { variantType: true } } } },
          batches: { where: { remaining: { gt: 0 } } },
        },
      },
    },
  });

  const now = Date.now();
  const soonCutoff = now + 7 * DAY_MS;

  let expiredBatches = 0;
  let expiringSoonBatches = 0;

  const data: InventoryView[] = products.flatMap((product) =>
    product.variants.map((variant) => {
      const batches = sortBatchesForFifo(variant.batches).map((batch) => {
        const time = batch.expiresAt ? new Date(batch.expiresAt).getTime() : null;
        if (time !== null && time < now) expiredBatches += 1;
        else if (time !== null && time <= soonCutoff) expiringSoonBatches += 1;

        return {
          id: batch.id,
          quantity: batch.quantity,
          remaining: batch.remaining,
          expiresAt: batch.expiresAt,
          batchNumber: batch.batchNumber,
          note: batch.note,
          createdAt: batch.createdAt,
        };
      });

      const dated = batches.filter((batch) => batch.expiresAt);
      const nearestExpiry = dated.length > 0 ? dated[0].expiresAt : null;

      return {
        id: variant.id,
        sku: variant.sku,
        product: { id: product.id, name: product.name },
        attributes: variant.values.map((v) => ({
          type: v.variantValue.variantType.name,
          value: v.variantValue.name,
          hexCode: v.variantValue.hexCode,
        })),
        stock: variant.stock,
        priceOverride: variant.priceOverride,
        batches,
        nearestExpiry,
      };
    }),
  );

  return {
    data,
    lowStockCount: data.filter((item) => item.stock < 10).length,
    expiredBatches,
    expiringSoonBatches,
  };
}
