/*
  Warnings:

  - The values [owner] on the enum `ProjectMember_role` will be removed. If these variants are still used in the database, this will fail.

*/
-- AlterTable
ALTER TABLE `projectmember` MODIFY `role` ENUM('OWNER', 'ADMIN', 'MEMBER') NOT NULL;
