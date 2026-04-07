-- AlterTable
ALTER TABLE `Booking` ADD COLUMN `seatId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Flight` ADD COLUMN `categoria` ENUM('BASIC', 'PRIVATE', 'INTERNATIONAL') NOT NULL DEFAULT 'BASIC',
    ADD COLUMN `checkInTime` DATETIME(3) NULL,
    ADD COLUMN `lugarArribo` VARCHAR(191) NULL,
    ADD COLUMN `numeroAvion` VARCHAR(191) NULL,
    ADD COLUMN `puertaArribo` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `Seat` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `number` VARCHAR(191) NOT NULL,
    `seatClass` ENUM('FIRST', 'PREMIUM', 'ECONOMY') NOT NULL,
    `flightId` INTEGER NOT NULL,
    `isOccupied` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `Seat_flightId_number_key`(`flightId`, `number`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Booking` ADD CONSTRAINT `Booking_seatId_fkey` FOREIGN KEY (`seatId`) REFERENCES `Seat`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Seat` ADD CONSTRAINT `Seat_flightId_fkey` FOREIGN KEY (`flightId`) REFERENCES `Flight`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
