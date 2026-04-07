-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `discountPercent` INTEGER NULL DEFAULT 0,
    ADD COLUMN `finalPrice` DOUBLE NULL DEFAULT 0,
    ADD COLUMN `offerId` INTEGER NULL;

-- CreateTable
CREATE TABLE `TravelOffer` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `destination` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NOT NULL,
    `imageUrl` VARCHAR(191) NOT NULL,
    `originalPrice` DOUBLE NOT NULL,
    `discountPrice` DOUBLE NOT NULL,
    `discountPercent` INTEGER NOT NULL,
    `isActive` BOOLEAN NOT NULL DEFAULT true,
    `destinationCode` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_offerId_fkey` FOREIGN KEY (`offerId`) REFERENCES `TravelOffer`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
