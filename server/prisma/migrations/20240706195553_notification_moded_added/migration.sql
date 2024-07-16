/*
  Warnings:

  - A unique constraint covering the columns `[code]` on the table `RoomInvite` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `owner_id` to the `Notification` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_friend_request_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_id_fkey";

-- DropForeignKey
ALTER TABLE "Notification" DROP CONSTRAINT "Notification_room_invite_id_fkey";

-- AlterTable
ALTER TABLE "Notification" ADD COLUMN     "date_created" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "owner_id" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "RoomInvite_code_key" ON "RoomInvite"("code");

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_friend_request_id_fkey" FOREIGN KEY ("friend_request_id") REFERENCES "FriendRequest"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_room_invite_id_fkey" FOREIGN KEY ("room_invite_id") REFERENCES "RoomInvite"("id") ON DELETE CASCADE ON UPDATE CASCADE;
