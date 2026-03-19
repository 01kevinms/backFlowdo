-- AlterTable
ALTER TABLE `conversation` ADD COLUMN `lastMessageAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `task` MODIFY `priority` ENUM('URGENT', 'HIGH', 'MEDIUM', 'LOW') NOT NULL DEFAULT 'LOW';
