-- DropForeignKey
ALTER TABLE `message` DROP FOREIGN KEY `Message_conversationId_fkey`;

-- AddForeignKey
ALTER TABLE `Message` ADD CONSTRAINT `Message_conversationId_fkey` FOREIGN KEY (`conversationId`) REFERENCES `Conversation`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
