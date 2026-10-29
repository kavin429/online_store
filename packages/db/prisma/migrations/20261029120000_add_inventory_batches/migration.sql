-- CreateTable
CREATE TABLE `InventoryBatch` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `productVariantId` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `remaining` INTEGER NOT NULL,
    `expiresAt` DATETIME(3) NULL,
    `batchNumber` VARCHAR(191) NULL,
    `note` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `InventoryBatch_productVariantId_expiresAt_idx`(`productVariantId`, `expiresAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `InventoryBatch` ADD CONSTRAINT `InventoryBatch_productVariantId_fkey` FOREIGN KEY (`productVariantId`) REFERENCES `ProductVariant`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- Backfill one untracked (no expiry) batch for stock that already exists, so
-- FIFO sales after this migration have a batch to consume. The variant's own
-- createdAt keeps legacy stock ahead of future restocks.
INSERT INTO `InventoryBatch` (`productVariantId`, `quantity`, `remaining`, `createdAt`)
SELECT `id`, `stock`, `stock`, `createdAt`
FROM `ProductVariant`
WHERE `stock` > 0;
