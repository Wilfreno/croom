/*
  Warnings:

  - Made the column `conversation_id` on table `Message` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversation_id_fkey";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "conversation_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "DirectConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
