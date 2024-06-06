-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "PhotoMessage" DROP CONSTRAINT "PhotoMessage_message_id_fkey";

-- DropIndex
DROP INDEX "Message_conversation_id_key";

-- AlterTable
ALTER TABLE "Message" ALTER COLUMN "conversation_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PhotoMessage" ALTER COLUMN "message_id" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "DirectConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
