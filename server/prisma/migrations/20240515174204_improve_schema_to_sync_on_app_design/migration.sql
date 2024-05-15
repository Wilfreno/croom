/*
  Warnings:

  - You are about to drop the column `room_id` on the `User` table. All the data in the column will be lost.
  - You are about to drop the column `owner_id` on the `Video` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_room_id_fkey";

-- DropForeignKey
ALTER TABLE "Video" DROP CONSTRAINT "Video_owner_id_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "room_id",
ADD COLUMN     "provider" TEXT,
ALTER COLUMN "password" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Video" DROP COLUMN "owner_id";

-- CreateTable
CREATE TABLE "_RoomToUser" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "_RoomToUser_AB_unique" ON "_RoomToUser"("A", "B");

-- CreateIndex
CREATE INDEX "_RoomToUser_B_index" ON "_RoomToUser"("B");

-- AddForeignKey
ALTER TABLE "_RoomToUser" ADD CONSTRAINT "_RoomToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Room"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_RoomToUser" ADD CONSTRAINT "_RoomToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
