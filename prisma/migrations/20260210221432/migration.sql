/*
  Warnings:

  - You are about to drop the column `doingByid` on the `task` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE `task` DROP FOREIGN KEY `Task_doingByid_fkey`;

-- DropIndex
DROP INDEX `Task_doingByid_fkey` ON `task`;

-- AlterTable
ALTER TABLE `task` DROP COLUMN `doingByid`,
    ADD COLUMN `doingById` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_doingById_fkey` FOREIGN KEY (`doingById`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
