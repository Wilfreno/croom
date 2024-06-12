/*
  Warnings:

  - You are about to drop the column `message_id` on the `PhotoMessage` table. All the data in the column will be lost.
  - You are about to drop the column `message_id` on the `TextMessage` table. All the data in the column will be lost.
  - You are about to drop the column `message_id` on the `VideoMessage` table. All the data in the column will be lost.
  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `_RoomToUser` table. If the table is not empty, all the data it contains will be lost.
  - A unique constraint covering the columns `[direct_message_id]` on the table `PhotoMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lounge_message_id]` on the table `PhotoMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_message_id]` on the table `PhotoMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[room_name]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[direct_message_id]` on the table `TextMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lounge_message_id]` on the table `TextMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_message_id]` on the table `TextMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[direct_message_id]` on the table `VideoMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[lounge_message_id]` on the table `VideoMessage` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[session_message_id]` on the table `VideoMessage` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `lounge_message_id` to the `PhotoMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_message_id` to the `PhotoMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `lounge_message_id` to the `VideoMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `session_message_id` to the `VideoMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'PHOTO', 'VIDEO');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('MEMBER', 'MODERATOR');

-- DropForeignKey
ALTER TABLE "Lounge" DROP CONSTRAINT "Lounge_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_lounge_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_receiver_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_session_id_fkey";

-- DropForeignKey
ALTER TABLE "PhotoMessage" DROP CONSTRAINT "PhotoMessage_message_id_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_room_id_fkey";

-- DropForeignKey
ALTER TABLE "TextMessage" DROP CONSTRAINT "TextMessage_message_id_fkey";

-- DropForeignKey
ALTER TABLE "VideoMessage" DROP CONSTRAINT "VideoMessage_message_id_fkey";

-- DropForeignKey
ALTER TABLE "_RoomToUser" DROP CONSTRAINT "_RoomToUser_A_fkey";

-- DropForeignKey
ALTER TABLE "_RoomToUser" DROP CONSTRAINT "_RoomToUser_B_fkey";

-- DropIndex
DROP INDEX "PhotoMessage_message_id_key";

-- DropIndex
DROP INDEX "TextMessage_message_id_key";

-- DropIndex
DROP INDEX "VideoMessage_message_id_key";

-- AlterTable
ALTER TABLE "PhotoMessage" DROP COLUMN "message_id",
ADD COLUMN     "direct_message_id" TEXT,
ADD COLUMN     "lounge_message_id" TEXT NOT NULL,
ADD COLUMN     "session_message_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "TextMessage" DROP COLUMN "message_id",
ADD COLUMN     "direct_message_id" TEXT,
ADD COLUMN     "lounge_message_id" TEXT,
ADD COLUMN     "session_message_id" TEXT;

-- AlterTable
ALTER TABLE "VideoMessage" DROP COLUMN "message_id",
ADD COLUMN     "direct_message_id" TEXT,
ADD COLUMN     "lounge_message_id" TEXT NOT NULL,
ADD COLUMN     "session_message_id" TEXT NOT NULL;

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "_RoomToUser";

-- CreateTable
CREATE TABLE "DirectMessage" (
    "id" TEXT NOT NULL,
    "conversation_id" TEXT,
    "sender_id" TEXT NOT NULL,
    "receiver_id" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "seen" BOOLEAN NOT NULL DEFAULT false,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DirectMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomMember" (
    "id" TEXT NOT NULL,
    "room_id" TEXT NOT NULL,
    "role" "Role" NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomMember_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LoungeMessage" (
    "id" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "lounge_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LoungeMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SessionMessage" (
    "id" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "session_id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SessionMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DirectMessage_id_key" ON "DirectMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "LoungeMessage_id_key" ON "LoungeMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "SessionMessage_id_key" ON "SessionMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoMessage_direct_message_id_key" ON "PhotoMessage"("direct_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoMessage_lounge_message_id_key" ON "PhotoMessage"("lounge_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoMessage_session_message_id_key" ON "PhotoMessage"("session_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "Room_room_name_key" ON "Room"("room_name");

-- CreateIndex
CREATE UNIQUE INDEX "TextMessage_direct_message_id_key" ON "TextMessage"("direct_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "TextMessage_lounge_message_id_key" ON "TextMessage"("lounge_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "TextMessage_session_message_id_key" ON "TextMessage"("session_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMessage_direct_message_id_key" ON "VideoMessage"("direct_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMessage_lounge_message_id_key" ON "VideoMessage"("lounge_message_id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMessage_session_message_id_key" ON "VideoMessage"("session_message_id");

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "DirectConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DirectMessage" ADD CONSTRAINT "DirectMessage_receiver_id_fkey" FOREIGN KEY ("receiver_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomMember" ADD CONSTRAINT "RoomMember_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lounge" ADD CONSTRAINT "Lounge_id_fkey" FOREIGN KEY ("id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoungeMessage" ADD CONSTRAINT "LoungeMessage_lounge_id_fkey" FOREIGN KEY ("lounge_id") REFERENCES "Lounge"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LoungeMessage" ADD CONSTRAINT "LoungeMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMessage" ADD CONSTRAINT "SessionMessage_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SessionMessage" ADD CONSTRAINT "SessionMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_direct_message_id_fkey" FOREIGN KEY ("direct_message_id") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_lounge_message_id_fkey" FOREIGN KEY ("lounge_message_id") REFERENCES "LoungeMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_session_message_id_fkey" FOREIGN KEY ("session_message_id") REFERENCES "SessionMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_direct_message_id_fkey" FOREIGN KEY ("direct_message_id") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_lounge_message_id_fkey" FOREIGN KEY ("lounge_message_id") REFERENCES "LoungeMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_session_message_id_fkey" FOREIGN KEY ("session_message_id") REFERENCES "SessionMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_direct_message_id_fkey" FOREIGN KEY ("direct_message_id") REFERENCES "DirectMessage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_lounge_message_id_fkey" FOREIGN KEY ("lounge_message_id") REFERENCES "LoungeMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_session_message_id_fkey" FOREIGN KEY ("session_message_id") REFERENCES "SessionMessage"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
