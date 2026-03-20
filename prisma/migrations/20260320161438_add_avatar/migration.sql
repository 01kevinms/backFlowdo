/*
  Warnings:

  - You are about to alter the column `type` on the `Notification` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Enum(EnumId(4))`.

*/
-- AlterTable
ALTER TABLE `Notification` MODIFY `type` ENUM('TASK_CREATED', 'STATUS_CHANGED', 'PRIORITY_CHANGED', 'COMMENT_ADDED', 'TASK_APPROVED', 'TASK_REJECTED', 'MEMBER_ADDED', 'ROLE_UPDATED', 'FRIEND_REQUEST_ACCEPTED', 'FRIEND_REQUEST_REJECTED', 'NEW_MESSAGE', 'MEMBER_LEAVE') NOT NULL;
