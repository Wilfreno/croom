/*
  Warnings:

  - You are about to drop the column `direct_message_id` on the `PhotoMessage` table. All the data in the column will be lost.
  - You are about to drop the column `direct_message_id` on the `TextMessage` table. All the data in the column will be lost.
  - You are about to drop the column `direct_message_id` on the `VideoMessage` table. All the data in the column will be lost.
  - You are about to drop the `DirectMessage` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Room` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_room-to-user` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[message_id]` on the table `PhotoMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[message_id]` on the table `TextMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[message_id]` on the table `VideoMessage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `message_id` to the `PhotoMessage` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "DirectMessage" DROP CONSTRAINT "DirectMessage_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "PhotoMessage" DROP CONSTRAINT "PhotoMessage_direct_message_id_fkey";

-- DropForeignKey
ALTER TABLE "RoomMessage" DROP CONSTRAINT "RoomMessage_room_id_fkey";

-- DropForeignKey
ALTER TABLE "TextMessage" DROP CONSTRAINT "TextMessage_direct_message_id_fkey";

-- DropForeignKey
ALTER TABLE "VideoMessage" DROP CONSTRAINT "VideoMessage_direct_message_id_fkey";

-- DropForeignKey
ALTER TABLE "_room-to-user" DROP CONSTRAINT "_room-to-user_A_fkey";

-- DropForeignKey
ALTER TABLE "_room-to-user" DROP CONSTRAINT "_room-to-user_B_fkey";

-- DropIndex
DROP INDEX "PhotoMessage_direct_message_id_key";

-- DropIndex
DROP INDEX "TextMessage_direct_message_id_key";

-- DropIndex
DROP INDEX "VideoMessage_direct_message_id_key";

-- AlterTable
ALTER TABLE "PhotoMessage" DROP COLUMN "direct_message_id",
ADD COLUMN     "message_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TextMessage" DROP COLUMN "direct_message_id",
ADD COLUMN     "message_id" TEXT;

-- AlterTable
ALTER TABLE "VideoMessage" DROP COLUMN "direct_message_id",
ADD COLUMN     "message_id" TEXT;

-- DropTable
DROP TABLE "DirectMessage";

-- DropTable
DROP TABLE "Room";

-- DropTable
DROP TABLE "_room-to-user";

-- CreateTable
CREATE TABLE "DirectConversation" (
    "id" TEXT NOT NULL,
    "user1_id" TEXT NOT NULL,
    "user2_id" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectConversation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Message" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Message_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectConversation_id_key" ON "DirectConversation"("id");

-- CreateIndex
CREATE UNIQUE INDEX "DirectConversation_user1_id_user2_id_key" ON "DirectConversation"("user1_id", "user2_id");

-- CreateIndex
CREATE UNIQUE INDEX "Message_id_key" ON "Message"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Message_conversation_id_key" ON "Message"("conversation_id");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoMessage_message_id_key" ON "PhotoMessage"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "TextMessage_message_id_key" ON "TextMessage"("message_id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMessage_message_id_key" ON "VideoMessage"("message_id");

-- AddForeignKey
ALTER TABLE "DirectConversation" ADD CONSTRAINT "DirectConversation_user1_id_fkey" FOREIGN KEY ("user1_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectConversation" ADD CONSTRAINT "DirectConversation_user2_id_fkey" FOREIGN KEY ("user2_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "DirectConversation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "Message"("id") ON DELETE SET NULL ON UPDATE CASCADE;
