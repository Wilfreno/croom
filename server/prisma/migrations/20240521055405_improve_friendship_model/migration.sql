/*
  Warnings:

  - The primary key for the `Friendship` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `friend_id` on the `Friendship` table. All the data in the column will be lost.
  - You are about to drop the column `id` on the `Friendship` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[friend_1_id,friend_2_id]` on the table `Friendship` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `friend_1_id` to the `Friendship` table without a default value. This is not possible if the table is not empty.
  - Added the required column `friend_2_id` to the `Friendship` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_friend_id_fkey";

-- DropIndex
DROP INDEX "Friendship_id_key";

-- AlterTable
ALTER TABLE "Friendship" DROP CONSTRAINT "Friendship_pkey",
DROP COLUMN "friend_id",
DROP COLUMN "id",
ADD COLUMN     "friend_1_id" TEXT NOT NULL,
ADD COLUMN     "friend_2_id" TEXT NOT NULL,
ADD CONSTRAINT "Friendship_pkey" PRIMARY KEY ("friend_1_id", "friend_2_id");

-- CreateIndex
CREATE UNIQUE INDEX "Friendship_friend_1_id_friend_2_id_key" ON "Friendship"("friend_1_id", "friend_2_id");

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friend_1_id_fkey" FOREIGN KEY ("friend_1_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Friendship" ADD CONSTRAINT "Friendship_friend_2_id_fkey" FOREIGN KEY ("friend_2_id") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
