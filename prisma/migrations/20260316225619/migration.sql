/*
  Warnings:

  - You are about to alter the column `priority` on the `task` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Enum(EnumId(3))`.

*/
-- AlterTable
ALTER TABLE `task` MODIFY `priority` ENUM('LOW', 'MEDIUM', 'HIGH', 'URGENT') NOT NULL DEFAULT 'LOW';
