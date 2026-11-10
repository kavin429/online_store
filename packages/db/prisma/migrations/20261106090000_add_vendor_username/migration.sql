-- AlterTable
ALTER TABLE `Vendor` ADD COLUMN `username` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `Vendor_username_key` ON `Vendor`(`username`);
