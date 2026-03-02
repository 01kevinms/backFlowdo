/*
  Warnings:

  - You are about to drop the `pendingtask` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE `pendingtask` DROP FOREIGN KEY `PendingTask_createdById_fkey`;

-- DropForeignKey
ALTER TABLE `pendingtask` DROP FOREIGN KEY `PendingTask_projectId_fkey`;

-- AlterTable
ALTER TABLE `task` ADD COLUMN `requestedById` VARCHAR(191) NULL;

-- DropTable
DROP TABLE `pendingtask`;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_requestedById_fkey` FOREIGN KEY (`requestedById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
