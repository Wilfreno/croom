/*
  Warnings:

  - You are about to drop the column `room_message_id` on the `PhotoMessage` table. All the data in the column will be lost.
  - You are about to drop the column `room_message_id` on the `TextMessage` table. All the data in the column will be lost.
  - You are about to drop the column `room_message_id` on the `VideoMessage` table. All the data in the column will be lost.
  - You are about to drop the `RoomMessage` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_conversation_id_fkey";

-- DropForeignKey
ALTER TABLE "PhotoMessage" DROP CONSTRAINT "PhotoMessage_room_message_id_fkey";

-- DropForeignKey
ALTER TABLE "RoomMessage" DROP CONSTRAINT "RoomMessage_sender_id_fkey";

-- DropForeignKey
ALTER TABLE "TextMessage" DROP CONSTRAINT "TextMessage_room_message_id_fkey";

-- DropForeignKey
ALTER TABLE "VideoMessage" DROP CONSTRAINT "VideoMessage_room_message_id_fkey";

-- DropIndex
DROP INDEX "PhotoMessage_room_message_id_key";

-- DropIndex
DROP INDEX "TextMessage_room_message_id_key";

-- DropIndex
DROP INDEX "VideoMessage_room_message_id_key";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "lounge_id" TEXT,
ADD COLUMN     "session_id" TEXT,
ALTER COLUMN "conversation_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "PhotoMessage" DROP COLUMN "room_message_id";

-- AlterTable
ALTER TABLE "TextMessage" DROP COLUMN "room_message_id";

-- AlterTable
ALTER TABLE "VideoMessage" DROP COLUMN "room_message_id";

-- DropTable
DROP TABLE "RoomMessage";

-- CreateTable
CREATE TABLE "Room" (
    "id" TEXT NOT NULL,
    "room_name" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Room_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lounge" (
    "id" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lounge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "room_id" TEXT,
    "name" TEXT NOT NULL,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "_RoomToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Room_id_key" ON "Room"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Lounge_id_key" ON "Lounge"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Session_id_key" ON "Session"("id");

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToUser_AB_unique" ON "_RoomToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToUser_B_index" ON "_RoomToUser"("B");

-- AddForeignKey
ALTER TABLE "Lounge" ADD CONSTRAINT "Lounge_id_fkey" FOREIGN KEY ("id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_conversation_id_fkey" FOREIGN KEY ("conversation_id") REFERENCES "DirectConversation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_lounge_id_fkey" FOREIGN KEY ("lounge_id") REFERENCES "Lounge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Message" ADD CONSTRAINT "Message_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToUser" ADD CONSTRAINT "_RoomToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToUser" ADD CONSTRAINT "_RoomToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
