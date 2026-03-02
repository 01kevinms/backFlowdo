-- AlterTable
ALTER TABLE `task` ADD COLUMN `doingByid` VARCHAR(191) NULL;

-- AddForeignKey
ALTER TABLE `Task` ADD CONSTRAINT `Task_doingByid_fkey` FOREIGN KEY (`doingByid`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
