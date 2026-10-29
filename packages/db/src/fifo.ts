/**
 * File: packages/db/src/fifo.ts
 *
 * First-In-First-Out helpers shared by the vendor (restock) and store (order)
 * apps. Batches with an expiry date are consumed before batches without one,
 * and the earliest expiry is always consumed first.
 */

export type FifoBatch = {
  id: number;
  remaining: number;
  expiresAt?: Date | string | null;
  createdAt?: Date | string | null;
};

export type FifoAllocation = {
  batchId: number;
  quantity: number;
};

export type FifoPlan = {
  allocations: FifoAllocation[];
  /** Quantity of `requested` that no batch could cover. */
  unallocated: number;
};

function toTime(value: Date | string | null | undefined): number | null {
  if (!value) return null;
  const time = value instanceof Date ? value.getTime() : new Date(value).getTime();
  return Number.isNaN(time) ? null : time;
}

/**
 * Sort batches the way FIFO consumes them:
 *   1. batches with an expiry date first (earliest expiry first)
 *   2. then batches without an expiry date (oldest received first)
 *   3. ties broken by batch id so the order is stable
 */
export function sortBatchesForFifo<T extends FifoBatch>(batches: T[]): T[] {
  return [...batches].sort((a, b) => {
    const aExpiry = toTime(a.expiresAt);
    const bExpiry = toTime(b.expiresAt);

    if (aExpiry !== null && bExpiry !== null && aExpiry !== bExpiry) {
      return aExpiry - bExpiry;
    }
    if (aExpiry !== null && bExpiry === null) return -1;
    if (aExpiry === null && bExpiry !== null) return 1;

    const aCreated = toTime(a.createdAt) ?? 0;
    const bCreated = toTime(b.createdAt) ?? 0;
    if (aCreated !== bCreated) return aCreated - bCreated;

    return a.id - b.id;
  });
}

/**
 * Work out how many units come from each batch for a requested quantity.
 * This function does not mutate the batches; callers persist the allocations.
 */
export function planFifo<T extends FifoBatch>(batches: T[], requested: number): FifoPlan {
  const need = Math.max(0, Math.floor(requested));
  const allocations: FifoAllocation[] = [];
  let remainingNeed = need;

  for (const batch of sortBatchesForFifo(batches)) {
    if (remainingNeed <= 0) break;
    const available = Math.max(0, Math.floor(batch.remaining));
    if (available <= 0) continue;

    const take = Math.min(available, remainingNeed);
    allocations.push({ batchId: batch.id, quantity: take });
    remainingNeed -= take;
  }

  return { allocations, unallocated: remainingNeed };
}
