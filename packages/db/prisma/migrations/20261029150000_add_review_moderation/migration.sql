-- AlterTable: review moderation, reporting and verified-purchase flag
ALTER TABLE `Review`
    ADD COLUMN `status` ENUM('VISIBLE', 'HIDDEN') NOT NULL DEFAULT 'VISIBLE',
    ADD COLUMN `editedAt` DATETIME(3) NULL,
    ADD COLUMN `reportStatus` ENUM('NONE', 'OPEN', 'RESOLVED', 'DISMISSED') NOT NULL DEFAULT 'NONE',
    ADD COLUMN `reportReason` TEXT NULL,
    ADD COLUMN `reportedAt` DATETIME(3) NULL,
    ADD COLUMN `reportResolvedAt` DATETIME(3) NULL,
    ADD COLUMN `reportedByVendorId` INTEGER NULL,
    ADD COLUMN `adminNote` TEXT NULL,
    ADD COLUMN `verifiedPurchase` BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: replies can be written by a customer, vendor or admin
ALTER TABLE `ReviewResponse`
    ADD COLUMN `authorType` ENUM('CUSTOMER', 'VENDOR', 'ADMIN') NOT NULL DEFAULT 'VENDOR',
    ADD COLUMN `userId` INTEGER NULL,
    ADD COLUMN `vendorId` INTEGER NULL,
    ADD COLUMN `adminId` INTEGER NULL;

-- CreateIndex
CREATE INDEX `Review_userId_productId_idx` ON `Review`(`userId`, `productId`);

-- CreateIndex
CREATE INDEX `Review_productId_status_idx` ON `Review`(`productId`, `status`);

-- CreateIndex
CREATE INDEX `Review_reportStatus_idx` ON `Review`(`reportStatus`);

-- CreateIndex
CREATE INDEX `ReviewResponse_reviewId_idx` ON `ReviewResponse`(`reviewId`);

-- CreateIndex
CREATE INDEX `ReviewResponse_userId_idx` ON `ReviewResponse`(`userId`);

-- CreateIndex
CREATE INDEX `ReviewResponse_vendorId_idx` ON `ReviewResponse`(`vendorId`);

-- CreateIndex
CREATE INDEX `ReviewResponse_adminId_idx` ON `ReviewResponse`(`adminId`);

-- AddForeignKey
ALTER TABLE `Review` ADD CONSTRAINT `Review_reportedByVendorId_fkey` FOREIGN KEY (`reportedByVendorId`) REFERENCES `Vendor`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewResponse` ADD CONSTRAINT `ReviewResponse_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewResponse` ADD CONSTRAINT `ReviewResponse_vendorId_fkey` FOREIGN KEY (`vendorId`) REFERENCES `Vendor`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ReviewResponse` ADD CONSTRAINT `ReviewResponse_adminId_fkey` FOREIGN KEY (`adminId`) REFERENCES `Admin`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
