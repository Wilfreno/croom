/*
  Warnings:

  - You are about to drop the column `friend_1_id` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `friend_2_id` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `photo_url` on the `PhotoMessage` table. All the data in the column will be lost.
  - You are about to drop the column `photo_url` on the `ProfilePhoto` table. All the data in the column will be lost.
  - You are about to drop the column `room_name` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `room_type` on the `Room` table. All the data in the column will be lost.
  - You are about to drop the column `photo_url` on the `RoomPhoto` table. All the data in the column will be lost.
  - You are about to drop the column `provider` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `video_url` on the `VideoMessage` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[user_1_id,user_2_id]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[name]` on the table `Room` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `user_1_id` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `user_2_id` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `PhotoMessage` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `ProfilePhoto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `name` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `type` to the `Room` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `RoomPhoto` table without a default value. This is not possible if the table is not empty.
  - Added the required column `url` to the `VideoMessage` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FRIEND_REQUEST', 'ROOM_INVITE');

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friend_1_id_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friend_2_id_fkey";

-- DropIndex
DROP INDEX "Friendship_friend_1_id_friend_2_id_key";

-- DropIndex
DROP INDEX "Room_room_name_key";

-- AlterTable
ALTER TABLE "Friendship" DROP COLUMN "friend_1_id",
DROP COLUMN "friend_2_id",
ADD COLUMN     "user_1_id" TEXT NOT NULL,
ADD COLUMN     "user_2_id" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "PhotoMessage" DROP COLUMN "photo_url",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "ProfilePhoto" DROP COLUMN "photo_url",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "Room" DROP COLUMN "room_name",
DROP COLUMN "room_type",
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "type" "RoomType" NOT NULL;

-- AlterTable
ALTER TABLE "RoomPhoto" DROP COLUMN "photo_url",
ADD COLUMN     "url" TEXT NOT NULL;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "provider";

-- AlterTable
ALTER TABLE "VideoMessage" DROP COLUMN "video_url",
ADD COLUMN     "url" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "type" "NotificationType" NOT NULL,
    "friend_request_id" TEXT,
    "room_invite_id" TEXT,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RoomInvite" (
    "id" TEXT NOT NULL,
    "room_id" TEXT,
    "code" TEXT NOT NULL,
    "last_updated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RoomInvite_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Notification_id_key" ON "Notification"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_friend_request_id_key" ON "Notification"("friend_request_id");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_room_invite_id_key" ON "Notification"("room_invite_id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInvite_id_key" ON "RoomInvite"("id");

-- CreateIndex
CREATE UNIQUE INDEX "RoomInvite_room_id_key" ON "RoomInvite"("room_id");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_user_1_id_user_2_id_key" ON "Friendship"("user_1_id", "user_2_id");

-- CreateIndex
CREATE UNIQUE INDEX "Room_name_key" ON "Room"("name");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_fkey" FOREIGN KEY ("id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_friend_request_id_fkey" FOREIGN KEY ("friend_request_id") REFERENCES "FriendRequest"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_room_invite_id_fkey" FOREIGN KEY ("room_invite_id") REFERENCES "RoomInvite"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user_1_id_fkey" FOREIGN KEY ("user_1_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_user_2_id_fkey" FOREIGN KEY ("user_2_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RoomInvite" ADD CONSTRAINT "RoomInvite_room_id_fkey" FOREIGN KEY ("room_id") REFERENCES "Room"("id") ON DELETE SET NULL ON UPDATE CASCADE;
