-- DropForeignKey
ALTER TABLE `activity` DROP FOREIGN KEY `Activity_projectId_fkey`;

-- DropIndex
DROP INDEX `Activity_projectId_fkey` ON `activity`;

-- AddForeignKey
ALTER TABLE `Activity` ADD CONSTRAINT `Activity_projectId_fkey` FOREIGN KEY (`projectId`) REFERENCES `Project`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
