/*
  Warnings:

  - The primary key for the `FriendRequest` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `Friendship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - A unique constraint covering the columns `[id]` on the table `FriendRequest` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[id]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `FriendRequest` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `Friendship` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friend_1_id_fkey";

-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friend_2_id_fkey";

-- AlterTable
ALTER TABLE "FriendRequest" DROP CONSTRAINT "FriendRequest_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "FriendRequest_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD CONSTRAINT "Friendship_pkey" PRIMARY KEY ("id");

-- CreateIndex
CREATE UNIQUE INDEX "FriendRequest_id_key" ON "FriendRequest"("id");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_id_key" ON "Friendship"("id");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friend_1_id_fkey" FOREIGN KEY ("friend_1_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friend_2_id_fkey" FOREIGN KEY ("friend_2_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
