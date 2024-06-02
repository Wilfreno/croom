/*
  Warnings:

  - You are about to drop the `Message` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Photo` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Video` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Message" DROP CONSTRAINT "Message_room_id_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_message_id_fkey";

-- DropForeignKey
ALTER TABLE "Photo" DROP CONSTRAINT "Photo_owner_id_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_message_id_fkey";

-- DropTable
DROP TABLE "Message";

-- DropTable
DROP TABLE "Photo";

-- DropTable
DROP TABLE "Video";

-- CreateTable
CREATE TABLE "ProfilePhoto" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilePhoto_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TextMessage" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "user_receiver_id" TEXT,
    "room_receiver_id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TextMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PhotoMessage" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "user_receiver_id" TEXT,
    "room_receiver_id" TEXT NOT NULL,
    "photo_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PhotoMessage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoMessage" (
    "id" TEXT NOT NULL,
    "sender_id" TEXT NOT NULL,
    "user_receiver_id" TEXT,
    "room_receiver_id" TEXT NOT NULL,
    "video_url" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "length" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VideoMessage_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePhoto_id_key" ON "ProfilePhoto"("id");

-- CreateIndex
CREATE UNIQUE INDEX "ProfilePhoto_owner_id_key" ON "ProfilePhoto"("owner_id");

-- CreateIndex
CREATE UNIQUE INDEX "TextMessage_id_key" ON "TextMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "PhotoMessage_id_key" ON "PhotoMessage"("id");

-- CreateIndex
CREATE UNIQUE INDEX "VideoMessage_id_key" ON "VideoMessage"("id");

-- AddForeignKey
ALTER TABLE "ProfilePhoto" ADD CONSTRAINT "ProfilePhoto_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_user_receiver_id_fkey" FOREIGN KEY ("user_receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TextMessage" ADD CONSTRAINT "TextMessage_room_receiver_id_fkey" FOREIGN KEY ("room_receiver_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_user_receiver_id_fkey" FOREIGN KEY ("user_receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PhotoMessage" ADD CONSTRAINT "PhotoMessage_room_receiver_id_fkey" FOREIGN KEY ("room_receiver_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_sender_id_fkey" FOREIGN KEY ("sender_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_user_receiver_id_fkey" FOREIGN KEY ("user_receiver_id") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoMessage" ADD CONSTRAINT "VideoMessage_room_receiver_id_fkey" FOREIGN KEY ("room_receiver_id") REFERENCES "Room"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
