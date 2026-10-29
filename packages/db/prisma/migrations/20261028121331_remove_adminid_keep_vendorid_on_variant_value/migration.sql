/*
  Warnings:

  - You are about to drop the column `adminId` on the `variantvalue` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `variantvalue` DROP FOREIGN KEY `VariantValue_adminId_fkey`;

-- AlterTable
ALTER TABLE `variantvalue` DROP COLUMN `adminId`;
