-- AlterTable
ALTER TABLE `order` ADD COLUMN `trackingNumber` VARCHAR(191) NULL;

-- AlterTable
ALTER TABLE `review` MODIFY `comment` TEXT NULL;

-- AlterTable
ALTER TABLE `reviewresponse` MODIFY `comment` TEXT NOT NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `dateOfBirth` DATETIME(3) NULL,
    ADD COLUMN `offersEmail` BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN `offersSms` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `phoneCode` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Address` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `label` VARCHAR(191) NOT NULL,
    `line` VARCHAR(191) NOT NULL,
    `country` VARCHAR(191) NOT NULL,
    `province` VARCHAR(191) NOT NULL,
    `district` VARCHAR(191) NOT NULL,
    `city` VARCHAR(191) NOT NULL,
    `postal` VARCHAR(191) NOT NULL,
    `isDefault` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `Address_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Address` ADD CONSTRAINT `Address_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
