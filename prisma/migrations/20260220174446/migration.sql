-- DropForeignKey
ALTER TABLE `notification` DROP FOREIGN KEY `Notification_activityId_fkey`;

-- DropIndex
DROP INDEX `Notification_activityId_fkey` ON `notification`;

-- AlterTable
ALTER TABLE `notification` ADD COLUMN `readAt` DATETIME(3) NULL,
    MODIFY `activityId` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Notification` ADD CONSTRAINT `Notification_activityId_fkey` FOREIGN KEY (`activityId`) REFERENCES `Activity`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
